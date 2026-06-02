import { prisma } from "@/lib/db";

export async function findProfileByUserId(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { organizerVerification: true },
  });
}

export async function updatePreferredLanguage(userId: string, preferredLanguage: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { preferredLanguage },
    include: { organizerVerification: true },
  });
}

export async function updateUserProfile(args: {
  userId: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  preferredLanguage: string;
  bio: string | null;
}) {
  return prisma.user.update({
    where: { id: args.userId },
    data: {
      fullName: args.fullName,
      email: args.email,
      phoneNumber: args.phoneNumber,
      preferredLanguage: args.preferredLanguage,
      bio: args.bio,
    },
    include: { organizerVerification: true },
  });
}

export async function updateProfilePicture(userId: string, profilePictureUrl: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { profilePictureUrl },
    include: { organizerVerification: true },
  });
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function getUserPasswordHash(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  return user?.passwordHash ?? null;
}
