import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { jwtVerify } from "jose";
import type { AccountStatus, UserRole } from "@prisma/client";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/tokens";
import { canAccessDashboard, defaultDashboardPath } from "@/lib/auth/rbac";
import { localePath, routing, stripLocalePrefix } from "@/i18n/routing";

const encoder = new TextEncoder();
const handleI18nRouting = createIntlMiddleware(routing);

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/pending",
  "/unauthorized",
  "/events",
  "/terms",
  "/privacy",
  "/refund-policy",
];

/** Public event detail only — not `/events/[slug]/book` (requires sign-in). */
function isPublicEventPath(pathname: string) {
  if (pathname === "/events") return true;
  const match = pathname.match(/^\/events\/([^/]+)\/?$/);
  return !!match;
}

function isPublicPath(pathname: string, method: string) {
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/signup/")) return true;
  if (isPublicEventPath(pathname)) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.includes(".")) return true;
  return false;
}

async function verifyToken(token: string) {
  const secret = process.env.AUTH_JWT_SECRET;
  const issuer = process.env.AUTH_JWT_ISSUER ?? "hibir-events";
  const audience = process.env.AUTH_JWT_AUDIENCE ?? "hibir-events:web";
  if (!secret || secret.length < 32) return null;

  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret), { issuer, audience });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      role: payload.role as UserRole,
      status: payload.status as AccountStatus,
    };
  } catch {
    return null;
  }
}

function getLocaleFromPath(pathname: string): "en" | "am" {
  if (pathname === "/am" || pathname.startsWith("/am/")) return "am";
  return "en";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const intlResponse = handleI18nRouting(request);
  const locale = getLocaleFromPath(request.nextUrl.pathname);
  const path = stripLocalePrefix(pathname);

  if (isPublicPath(path, request.method)) {
    if (path === "/login" || path.startsWith("/signup")) {
      const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          const dest = localePath(defaultDashboardPath(payload.role, payload.status), locale);
          return NextResponse.redirect(new URL(dest, request.url));
        }
      }
    }
    return intlResponse;
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) {
    const login = new URL(localePath("/login", locale), request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL(localePath("/login", locale), request.url));
    res.cookies.delete(ACCESS_COOKIE_NAME);
    return res;
  }

  if (payload.status === "suspended") {
    return NextResponse.redirect(new URL(localePath("/unauthorized?suspended=1", locale), request.url));
  }

  if (payload.role === "organizer" && payload.status === "pending") {
    const allowedWhilePending = path.startsWith("/pending") || path.startsWith("/profile");
    if (!allowedWhilePending) {
      return NextResponse.redirect(new URL(localePath("/pending", locale), request.url));
    }
    return intlResponse;
  }

  const home = localePath(defaultDashboardPath(payload.role, payload.status), locale);

  if (path.startsWith("/dashboard/attendee") && !canAccessDashboard(payload.role, "attendee")) {
    return NextResponse.redirect(new URL(home, request.url));
  }
  if (path.startsWith("/dashboard/organizer") && !canAccessDashboard(payload.role, "organizer")) {
    return NextResponse.redirect(new URL(home, request.url));
  }
  if (path.startsWith("/dashboard/admin") && !canAccessDashboard(payload.role, "admin")) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (path.startsWith("/profile/admin") && payload.role !== "admin") {
    return NextResponse.redirect(new URL(localePath(defaultDashboardPath(payload.role), locale), request.url));
  }
  if (path.startsWith("/profile/organizer") && payload.role === "attendee") {
    return NextResponse.redirect(new URL(localePath("/profile/attendee", locale), request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
