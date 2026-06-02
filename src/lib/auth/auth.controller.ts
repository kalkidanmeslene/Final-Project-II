import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  forgotPasswordSchema,
  loginSchema,
  parseOrganizerRequestBody,
  registerSchema,
  resetPasswordSchema,
} from "./auth.schemas";
import {
  adminApproveOrganizer,
  adminRejectOrganizer,
  adminSuspendUser,
  adminUnsuspendUser,
  login,
  logout,
  registerAttendee,
  requestOrganizer,
  requestPasswordReset,
  resetPassword,
  rotateRefreshToken,
} from "./auth.service";
import { clearAuthCookies, setAuthCookies, signAccessToken } from "./tokens";
import { getCurrentUser, requireCurrentUser, toAuthUser } from "./session";
import { findUserById, listPendingOrganizers } from "./auth.repository";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import { getRequestMeta } from "@/lib/http/request-meta";
import { env } from "@/lib/env";
import { sendPasswordResetEmail } from "@/lib/notifications/email.service";

function validationResponse(e: ZodError) {
  return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(e)), { status: 400 });
}

function unauthorizedResponse() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

function forbiddenResponse(message = "Forbidden.") {
  return NextResponse.json(fail("FORBIDDEN", message), { status: 403 });
}

export async function handleRegister(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const parsed = registerSchema.parse(await req.json());
    const user = await registerAttendee({
      fullName: parsed.fullName,
      email: parsed.email?.trim() ? parsed.email.trim() : null,
      phoneNumber: parsed.phoneNumber?.trim() ? parsed.phoneNumber.trim() : null,
      preferredLanguage: parsed.preferredLanguage,
      password: parsed.password,
      ipAddress,
      userAgent,
    });
    return NextResponse.json(ok({ userId: user.id }), { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(fail("CONFLICT", "Email or phone number already registered."), { status: 409 });
    }
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleLogin(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const parsed = loginSchema.parse(await req.json());
    const result = await login({
      identifier: parsed.identifier,
      password: parsed.password,
      ipAddress,
      userAgent,
    });

    if (!result.ok) {
      const map: Record<string, { status: number; code: string; message: string }> = {
        INVALID_CREDENTIALS: { status: 401, code: "INVALID_CREDENTIALS", message: "Invalid credentials." },
        SUSPENDED: { status: 403, code: "SUSPENDED", message: "Account is suspended." },
      };
      const m = map[result.code] ?? map.INVALID_CREDENTIALS;
      await clearAuthCookies();
      return NextResponse.json(fail(m.code, m.message), { status: m.status });
    }

    await setAuthCookies({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    return NextResponse.json(ok({ userId: result.userId }), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    await clearAuthCookies();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleLogout(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const { cookies } = await import("next/headers");
    const { REFRESH_COOKIE_NAME } = await import("./tokens");
    const refresh = (await cookies()).get(REFRESH_COOKIE_NAME)?.value;
    if (refresh) {
      const sessionId = refresh.split(".", 1)[0];
      if (sessionId) await logout({ sessionId, ipAddress, userAgent });
    }
    await clearAuthCookies();
    return NextResponse.json(ok({}), { status: 200 });
  } catch {
    await clearAuthCookies();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleRefresh(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const { cookies } = await import("next/headers");
    const { REFRESH_COOKIE_NAME } = await import("./tokens");
    const refresh = (await cookies()).get(REFRESH_COOKIE_NAME)?.value;
    if (!refresh) {
      await clearAuthCookies();
      return unauthorizedResponse();
    }

    const result = await rotateRefreshToken({ sessionRefreshToken: refresh, ipAddress, userAgent });
    if (!result.ok) {
      await clearAuthCookies();
      return unauthorizedResponse();
    }

    await setAuthCookies({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    return NextResponse.json(ok({ userId: result.userId }), { status: 200 });
  } catch {
    await clearAuthCookies();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleMe() {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  return NextResponse.json(ok({ user }), { status: 200 });
}

export async function handleOrganizerRequest(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const current = await requireCurrentUser();
    const parsed = parseOrganizerRequestBody(await req.json());

    await requestOrganizer({
      userId: current.id,
      displayName: parsed.displayName,
      portfolioUrl: parsed.portfolioUrl || null,
      city: parsed.city || null,
      contactPhone: parsed.contactPhone || null,
      about: parsed.about || null,
      referenceLinks: parsed.referenceLinks
        ? parsed.referenceLinks
            .split("\n")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
      ipAddress,
      userAgent,
    });

    const fresh = await findUserById(current.id);
    if (fresh) {
      const accessToken = await signAccessToken({
        sub: fresh.id,
        role: fresh.role,
        status: fresh.status,
      });
      const { cookies } = await import("next/headers");
      const { REFRESH_COOKIE_NAME } = await import("./tokens");
      const refresh = (await cookies()).get(REFRESH_COOKIE_NAME)?.value;
      if (refresh) {
        await setAuthCookies({ accessToken, refreshToken: refresh });
      }
    }

    return NextResponse.json(ok({ status: "pending" }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleForgotPassword(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const parsed = forgotPasswordSchema.parse(await req.json());
    const result = await requestPasswordReset({
      identifier: parsed.identifier,
      ipAddress,
      userAgent,
    });

    const payload: { message: string; resetUrl?: string } = {
      message: "If an account exists, password reset instructions were sent.",
    };

    if (result.resetToken && result.email) {
      const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${result.resetToken}`;
      const emailResult = await sendPasswordResetEmail({
        to: result.email,
        userName: result.fullName ?? "there",
        resetUrl,
      });
      if (!emailResult.ok) {
        console.warn("[auth] Password reset email failed:", emailResult.error);
        if (process.env.NODE_ENV === "development") {
          payload.resetUrl = resetUrl;
        }
      }
    } else if (process.env.NODE_ENV === "development" && result.resetToken) {
      payload.resetUrl = `${env.APP_BASE_URL}/reset-password?token=${result.resetToken}`;
    }

    return NextResponse.json(ok(payload), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleResetPassword(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const parsed = resetPasswordSchema.parse(await req.json());
    const result = await resetPassword({
      token: parsed.token,
      newPassword: parsed.newPassword,
      ipAddress,
      userAgent,
    });

    if (!result.ok) {
      return NextResponse.json(fail("INVALID_TOKEN", "Invalid or expired reset token."), { status: 400 });
    }

    return NextResponse.json(ok({ userId: result.userId }), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

async function requireAdmin() {
  const user = await requireCurrentUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

export async function handleAdminPendingOrganizers() {
  try {
    await requireAdmin();
    const pending = await listPendingOrganizers();
    return NextResponse.json(
      ok({
        organizers: pending.map((p) => ({
          userId: p.userId,
          fullName: p.user.fullName,
          email: p.user.email,
          organizationName: p.organizationName,
          status: p.status,
          createdAt: p.createdAt,
        })),
      }),
      { status: 200 },
    );
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbiddenResponse();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminApproveOrganizer(req: NextRequest, userId: string) {
  try {
    const admin = await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as { note?: string };
    await adminApproveOrganizer({ userId, adminUserId: admin.id, note: body.note ?? null });
    const user = await findUserById(userId);
    return NextResponse.json(ok({ user: user ? toAuthUser(user) : null }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbiddenResponse();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminRejectOrganizer(req: NextRequest, userId: string) {
  try {
    const admin = await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as { note?: string };
    await adminRejectOrganizer({ userId, adminUserId: admin.id, note: body.note ?? null });
    const user = await findUserById(userId);
    return NextResponse.json(ok({ user: user ? toAuthUser(user) : null }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbiddenResponse();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminSuspend(req: NextRequest, userId: string) {
  try {
    const admin = await requireAdmin();
    await adminSuspendUser({ userId, adminUserId: admin.id });
    return NextResponse.json(ok({ userId }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbiddenResponse();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminUnsuspend(req: NextRequest, userId: string) {
  try {
    const admin = await requireAdmin();
    await adminUnsuspendUser({ userId, adminUserId: admin.id });
    return NextResponse.json(ok({ userId }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbiddenResponse();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}
