import { createHash, randomUUID } from "crypto";
import { hashPassword, verifyPassword } from "./password";
import { signAccessToken } from "./tokens";
import { auditLog } from "@/lib/audit/audit.service";
import { env } from "@/lib/env";
import {
  createPasswordResetToken,
  createSession,
  createUser,
  findSessionById,
  findUserByEmailOrPhone,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
  revokeSession,
  setOrganizerVerificationStatus,
  setUserRoleAndStatus,
  suspendUser,
  unsuspendUser,
  updateUserPassword,
  upsertOrganizerVerification,
} from "./auth.repository";

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function registerAttendee(args: {
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  preferredLanguage: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const passwordHash = await hashPassword(args.password);
  const user = await createUser({
    fullName: args.fullName,
    email: args.email?.trim().toLowerCase() || null,
    phoneNumber: args.phoneNumber?.trim() || null,
    preferredLanguage: args.preferredLanguage,
    passwordHash,
    role: "attendee",
    status: "active",
  });

  await auditLog({
    userId: user.id,
    action: "register",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    metadata: { role: "attendee" },
  });

  return user;
}

export async function registerOrganizer(args: {
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  preferredLanguage: string;
  password: string;
  displayName: string;
  portfolioUrl?: string | null;
  contactPhone?: string | null;
  city?: string | null;
  about?: string | null;
  referenceLinks: string[];
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const passwordHash = await hashPassword(args.password);
  const user = await createUser({
    fullName: args.fullName,
    email: args.email?.trim().toLowerCase() || null,
    phoneNumber: args.phoneNumber?.trim() || null,
    preferredLanguage: args.preferredLanguage,
    passwordHash,
    role: "organizer",
    status: "pending",
  });

  const verification = await upsertOrganizerVerification({
    userId: user.id,
    organizationName: args.displayName,
    organizationWebsite: args.portfolioUrl ?? null,
    organizationAddress: args.city ?? null,
    organizationPhone: args.contactPhone ?? null,
    verificationDocsUrls: args.referenceLinks,
  });

  await auditLog({
    userId: user.id,
    action: "register",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    metadata: { role: "organizer", organizerVerificationId: verification.id },
  });

  await auditLog({
    userId: user.id,
    action: "organizer_request",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    metadata: { organizerVerificationId: verification.id },
  });

  return user;
}

export async function requestOrganizer(args: {
  userId: string;
  displayName: string;
  portfolioUrl?: string | null;
  city?: string | null;
  contactPhone?: string | null;
  about?: string | null;
  referenceLinks: string[];
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const verification = await upsertOrganizerVerification({
    userId: args.userId,
    organizationName: args.displayName,
    organizationWebsite: args.portfolioUrl ?? null,
    organizationAddress: args.city ?? null,
    organizationPhone: args.contactPhone ?? null,
    verificationDocsUrls: args.referenceLinks,
  });

  await setUserRoleAndStatus({ userId: args.userId, role: "organizer", status: "pending" });

  await auditLog({
    userId: args.userId,
    action: "organizer_request",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    metadata: { organizerVerificationId: verification.id },
  });

  return verification;
}

export async function login(args: {
  identifier: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const user = await findUserByEmailOrPhone(args.identifier);
  if (!user) {
    await auditLog({
      action: "login_failed",
      success: false,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: { reason: "not_found" },
    });
    return { ok: false as const, code: "INVALID_CREDENTIALS" as const };
  }

  if (user.status === "suspended") {
    await auditLog({
      userId: user.id,
      action: "login_failed",
      success: false,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: { reason: "suspended" },
    });
    return { ok: false as const, code: "SUSPENDED" as const };
  }

  const valid = await verifyPassword(args.password, user.passwordHash);
  if (!valid) {
    await auditLog({
      userId: user.id,
      action: "login_failed",
      success: false,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: { reason: "bad_password" },
    });
    return { ok: false as const, code: "INVALID_CREDENTIALS" as const };
  }

  const refreshToken = randomUUID() + "." + randomUUID();
  const refreshTokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + env.AUTH_REFRESH_TOKEN_TTL_SECONDS * 1000);

  const session = await createSession({
    userId: user.id,
    refreshTokenHash,
    userAgent: args.userAgent ?? null,
    ipAddress: args.ipAddress ?? null,
    expiresAt,
  });

  const accessToken = await signAccessToken({ sub: user.id, role: user.role, status: user.status });
  const sessionRefreshToken = `${session.id}.${refreshToken}`;

  await auditLog({
    userId: user.id,
    action: "login_success",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    metadata: { sessionId: session.id },
  });

  return {
    ok: true as const,
    accessToken,
    refreshToken: sessionRefreshToken,
    userId: user.id,
  };
}

export async function logout(args: { sessionId: string; userId?: string | null; ipAddress?: string | null; userAgent?: string | null }) {
  await revokeSession(args.sessionId);
  await auditLog({
    userId: args.userId ?? null,
    action: "logout",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    metadata: { sessionId: args.sessionId },
  });
}

export async function rotateRefreshToken(args: { sessionRefreshToken: string; ipAddress?: string | null; userAgent?: string | null }) {
  const [sessionId, rawRefresh] = args.sessionRefreshToken.split(".", 2);
  if (!sessionId || !rawRefresh) return { ok: false as const };

  const session = await findSessionById(sessionId);
  if (!session) return { ok: false as const };
  if (session.revokedAt) return { ok: false as const };
  if (session.expiresAt.getTime() < Date.now()) return { ok: false as const };

  const match = session.refreshTokenHash === sha256(rawRefresh);
  if (!match) return { ok: false as const };

  // rotate: revoke old session and mint a new one
  await revokeSession(session.id);

  const newRefreshToken = randomUUID() + "." + randomUUID();
  const newRefreshTokenHash = sha256(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + env.AUTH_REFRESH_TOKEN_TTL_SECONDS * 1000);

  const newSession = await createSession({
    userId: session.userId,
    refreshTokenHash: newRefreshTokenHash,
    userAgent: args.userAgent ?? null,
    ipAddress: args.ipAddress ?? null,
    expiresAt: newExpiresAt,
  });

  const accessToken = await signAccessToken({ sub: session.userId, role: session.user.role, status: session.user.status });
  const sessionRefreshToken = `${newSession.id}.${newRefreshToken}`;

  return { ok: true as const, accessToken, refreshToken: sessionRefreshToken, userId: session.userId };
}

export async function adminApproveOrganizer(args: { userId: string; adminUserId: string; note?: string | null }) {
  await setOrganizerVerificationStatus({
    userId: args.userId,
    status: "approved",
    reviewedBy: args.adminUserId,
    note: args.note ?? null,
  });
  await setUserRoleAndStatus({ userId: args.userId, role: "organizer", status: "active" });
  await auditLog({
    userId: args.userId,
    action: "organizer_approved",
    success: true,
    metadata: { reviewedBy: args.adminUserId, note: args.note ?? null },
  });
}

export async function adminRejectOrganizer(args: { userId: string; adminUserId: string; note?: string | null }) {
  await setOrganizerVerificationStatus({
    userId: args.userId,
    status: "rejected",
    reviewedBy: args.adminUserId,
    note: args.note ?? null,
  });
  await setUserRoleAndStatus({ userId: args.userId, role: "attendee", status: "active" });
  await auditLog({
    userId: args.userId,
    action: "organizer_rejected",
    success: true,
    metadata: { reviewedBy: args.adminUserId, note: args.note ?? null },
  });
}

export async function adminSuspendUser(args: { userId: string; adminUserId: string }) {
  await suspendUser({ userId: args.userId, suspendedBy: args.adminUserId });
  await auditLog({
    userId: args.userId,
    action: "suspend_account",
    success: true,
    metadata: { suspendedBy: args.adminUserId },
  });
}

export async function adminUnsuspendUser(args: { userId: string; adminUserId: string }) {
  await unsuspendUser({ userId: args.userId });
  await auditLog({
    userId: args.userId,
    action: "unsuspend_account",
    success: true,
    metadata: { unsuspendedBy: args.adminUserId },
  });
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export async function requestPasswordReset(args: {
  identifier: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const user = await findUserByEmailOrPhone(args.identifier);

  if (!user) {
    await auditLog({
      action: "forgot_password",
      success: false,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: { reason: "not_found" },
    });
    return { ok: true as const, resetToken: null, email: null, fullName: null };
  }

  const rawToken = randomUUID() + randomUUID();
  const tokenHash = sha256(rawToken);

  await createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  await auditLog({
    userId: user.id,
    action: "forgot_password",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });

  return {
    ok: true as const,
    resetToken: rawToken,
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
  };
}

export async function resetPassword(args: {
  token: string;
  newPassword: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const tokenHash = sha256(args.token);
  const record = await findValidPasswordResetToken(tokenHash);

  if (!record) {
    await auditLog({
      action: "reset_password",
      success: false,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: { reason: "invalid_token" },
    });
    return { ok: false as const, code: "INVALID_TOKEN" as const };
  }

  const passwordHash = await hashPassword(args.newPassword);
  await updateUserPassword(record.userId, passwordHash);
  await markPasswordResetTokenUsed(record.id);

  await auditLog({
    userId: record.userId,
    action: "reset_password",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });

  return { ok: true as const, userId: record.userId };
}

