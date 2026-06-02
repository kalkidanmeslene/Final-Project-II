import type { OrganizerVerificationStatus, User } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { rotateRefreshToken } from "./auth.service";
import type { AuthUser } from "./types";
import {
  getAccessTokenFromCookies,
  REFRESH_COOKIE_NAME,
  setAuthCookies,
  verifyAccessToken,
} from "./tokens";

export function toAuthUser(
  user: User & { organizerVerification?: { status: OrganizerVerificationStatus } | null },
): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    preferredLanguage: user.preferredLanguage,
    profilePictureUrl: user.profilePictureUrl,
    role: user.role,
    status: user.status,
    organizerVerificationStatus: user.organizerVerification?.status ?? null,
  };
}

async function userFromAccessToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = await verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { organizerVerification: true },
    });
    if (!user) return null;
    if (user.status === "suspended") return null;
    return toAuthUser(user);
  } catch {
    return null;
  }
}

async function userFromRefreshCookie(): Promise<AuthUser | null> {
  const store = await cookies();
  const refresh = store.get(REFRESH_COOKIE_NAME)?.value;
  if (!refresh) return null;

  const result = await rotateRefreshToken({ sessionRefreshToken: refresh });
  if (!result.ok) return null;

  await setAuthCookies({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  return userFromAccessToken(result.accessToken);
}

/** Resolves the current user, refreshing the access token from the refresh cookie when needed. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAccessTokenFromCookies();
  if (token) {
    const user = await userFromAccessToken(token);
    if (user) return user;
  }
  return userFromRefreshCookie();
}

export async function requireCurrentUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
