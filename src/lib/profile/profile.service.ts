import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { auditLog } from "@/lib/audit/audit.service";
import {
  findProfileByUserId,
  getUserPasswordHash,
  updatePreferredLanguage as updatePreferredLanguageRepo,
  updateProfilePicture,
  updateUserPassword,
  updateUserProfile,
} from "./profile.repository";
import { toUserProfile } from "./profile.mapper";
import { deleteAvatarFile, saveAvatarFile } from "./upload";

export async function getProfile(userId: string) {
  const user = await findProfileByUserId(userId);
  if (!user) return null;
  return toUserProfile(user);
}

export async function updatePreferredLanguage(args: {
  userId: string;
  preferredLanguage: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const user = await updatePreferredLanguageRepo(args.userId, args.preferredLanguage);
  await auditLog({
    userId: args.userId,
    action: "profile_updated",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    metadata: { field: "preferredLanguage" },
  });
  return toUserProfile(user);
}

export async function updateProfile(args: {
  userId: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  preferredLanguage: string;
  bio: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const user = await updateUserProfile(args);

  await auditLog({
    userId: args.userId,
    action: "profile_updated",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });

  return toUserProfile(user);
}

export async function changePassword(args: {
  userId: string;
  currentPassword: string;
  newPassword: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const passwordHash = await getUserPasswordHash(args.userId);
  if (!passwordHash) return { ok: false as const, code: "NOT_FOUND" as const };

  const valid = await verifyPassword(args.currentPassword, passwordHash);
  if (!valid) {
    await auditLog({
      userId: args.userId,
      action: "password_changed",
      success: false,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: { reason: "invalid_current_password" },
    });
    return { ok: false as const, code: "INVALID_CURRENT_PASSWORD" as const };
  }

  const newHash = await hashPassword(args.newPassword);
  await updateUserPassword(args.userId, newHash);

  await auditLog({
    userId: args.userId,
    action: "password_changed",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });

  return { ok: true as const };
}

export async function uploadProfileAvatar(args: {
  userId: string;
  file: File;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const existing = await findProfileByUserId(args.userId);
  if (!existing) return { ok: false as const, code: "NOT_FOUND" as const };

  const { publicUrl } = await saveAvatarFile(args.userId, args.file);
  const user = await updateProfilePicture(args.userId, publicUrl);

  if (existing.profilePictureUrl && existing.profilePictureUrl !== publicUrl) {
    await deleteAvatarFile(existing.profilePictureUrl);
  }

  await auditLog({
    userId: args.userId,
    action: "profile_picture_uploaded",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    metadata: { url: publicUrl },
  });

  return { ok: true as const, profile: toUserProfile(user) };
}
