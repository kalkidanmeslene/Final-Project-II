import type { OrganizerVerificationStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function findUserByEmailOrPhone(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: normalized },
        { phoneNumber: identifier.trim() }, // phone numbers are treated as raw (country-specific formatting)
      ],
    },
    include: { organizerVerification: true },
  });
}

export async function createUser(args: {
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  preferredLanguage: string;
  passwordHash: string;
  role?: UserRole;
  status?: "active" | "pending";
}) {
  return prisma.user.create({
    data: {
      fullName: args.fullName,
      email: args.email ?? null,
      phoneNumber: args.phoneNumber ?? null,
      preferredLanguage: args.preferredLanguage,
      passwordHash: args.passwordHash,
      role: args.role ?? "attendee",
      status: args.status ?? "active",
    },
  });
}

export async function upsertOrganizerVerification(args: {
  userId: string;
  organizationName: string;
  organizationWebsite?: string | null;
  organizationAddress?: string | null;
  organizationPhone?: string | null;
  verificationDocsUrls: string[];
}) {
  return prisma.organizerVerification.upsert({
    where: { userId: args.userId },
    create: {
      userId: args.userId,
      organizationName: args.organizationName,
      organizationWebsite: args.organizationWebsite ?? null,
      organizationAddress: args.organizationAddress ?? null,
      organizationPhone: args.organizationPhone ?? null,
      verificationDocsUrls: args.verificationDocsUrls,
      status: "pending",
    },
    update: {
      organizationName: args.organizationName,
      organizationWebsite: args.organizationWebsite ?? null,
      organizationAddress: args.organizationAddress ?? null,
      organizationPhone: args.organizationPhone ?? null,
      verificationDocsUrls: args.verificationDocsUrls,
      status: "pending",
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: null,
    },
  });
}

export async function setOrganizerVerificationStatus(args: {
  userId: string;
  status: OrganizerVerificationStatus;
  reviewedBy: string;
  note?: string | null;
}) {
  return prisma.organizerVerification.update({
    where: { userId: args.userId },
    data: {
      status: args.status,
      reviewedAt: new Date(),
      reviewedBy: args.reviewedBy,
      reviewNote: args.note ?? null,
    },
  });
}

export async function setUserRoleAndStatus(args: { userId: string; role: UserRole; status: "active" | "pending" }) {
  return prisma.user.update({
    where: { id: args.userId },
    data: { role: args.role, status: args.status },
  });
}

export async function suspendUser(args: { userId: string; suspendedBy: string }) {
  return prisma.user.update({
    where: { id: args.userId },
    data: { status: "suspended", suspendedAt: new Date(), suspendedBy: args.suspendedBy },
  });
}

export async function unsuspendUser(args: { userId: string }) {
  return prisma.user.update({
    where: { id: args.userId },
    data: { status: "active", suspendedAt: null, suspendedBy: null },
  });
}

export async function createSession(args: {
  userId: string;
  refreshTokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
}) {
  return prisma.session.create({
    data: {
      userId: args.userId,
      refreshTokenHash: args.refreshTokenHash,
      userAgent: args.userAgent ?? null,
      ipAddress: args.ipAddress ?? null,
      expiresAt: args.expiresAt,
    },
  });
}

export async function findSessionById(id: string) {
  return prisma.session.findUnique({ where: { id }, include: { user: { include: { organizerVerification: true } } } });
}

export async function revokeSession(id: string) {
  return prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { organizerVerification: true },
  });
}

export async function createPasswordResetToken(args: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  await prisma.passwordResetToken.updateMany({
    where: { userId: args.userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  return prisma.passwordResetToken.create({
    data: {
      userId: args.userId,
      tokenHash: args.tokenHash,
      expiresAt: args.expiresAt,
    },
  });
}

export async function findValidPasswordResetToken(tokenHash: string) {
  return prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
}

export async function markPasswordResetTokenUsed(id: string) {
  return prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function listPendingOrganizers() {
  return prisma.organizerVerification.findMany({
    where: {
      status: "pending",
      user: { role: "organizer", status: "pending" },
    },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}

