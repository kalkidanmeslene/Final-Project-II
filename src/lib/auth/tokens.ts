import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { JwtAccessPayload } from "./types";
import { env } from "@/lib/env";

const encoder = new TextEncoder();

export const ACCESS_COOKIE_NAME = "hibir_access";
export const REFRESH_COOKIE_NAME = "hibir_refresh";

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function setAuthCookies(args: { accessToken: string; refreshToken: string }) {
  const store = await cookies();

  store.set(ACCESS_COOKIE_NAME, args.accessToken, {
    ...baseCookieOptions(),
    maxAge: env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
  });

  store.set(REFRESH_COOKIE_NAME, args.refreshToken, {
    ...baseCookieOptions(),
    maxAge: env.AUTH_REFRESH_TOKEN_TTL_SECONDS,
  });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.set(ACCESS_COOKIE_NAME, "", { ...baseCookieOptions(), maxAge: 0 });
  store.set(REFRESH_COOKIE_NAME, "", { ...baseCookieOptions(), maxAge: 0 });
}

export async function signAccessToken(payload: JwtAccessPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ role: payload.role, status: payload.status })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(env.AUTH_JWT_ISSUER)
    .setAudience(env.AUTH_JWT_AUDIENCE)
    .setSubject(payload.sub)
    .setIssuedAt(now)
    .setExpirationTime(now + env.AUTH_ACCESS_TOKEN_TTL_SECONDS)
    .sign(encoder.encode(env.AUTH_JWT_SECRET));
}

export async function verifyAccessToken(token: string): Promise<JwtAccessPayload> {
  const { payload } = await jwtVerify(token, encoder.encode(env.AUTH_JWT_SECRET), {
    issuer: env.AUTH_JWT_ISSUER,
    audience: env.AUTH_JWT_AUDIENCE,
  });

  if (typeof payload.sub !== "string") throw new Error("Invalid token subject.");
  const role = payload.role;
  const status = payload.status;

  if (typeof role !== "string" || typeof status !== "string") throw new Error("Invalid token payload.");

  return {
    sub: payload.sub,
    role: role as JwtAccessPayload["role"],
    status: status as JwtAccessPayload["status"],
  };
}

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE_NAME)?.value ?? null;
}
