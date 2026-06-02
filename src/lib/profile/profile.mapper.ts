import type { OrganizerVerification, User } from "@prisma/client";
import type { UserProfile } from "./profile.types";

export function toUserProfile(user: User & { organizerVerification: OrganizerVerification | null }): UserProfile {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    preferredLanguage: user.preferredLanguage,
    profilePictureUrl: user.profilePictureUrl,
    bio: user.bio,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    organizer: user.organizerVerification
      ? {
          organizationName: user.organizerVerification.organizationName,
          organizationWebsite: user.organizerVerification.organizationWebsite,
          organizationAddress: user.organizerVerification.organizationAddress,
          organizationPhone: user.organizerVerification.organizationPhone,
          verificationDocsUrls: user.organizerVerification.verificationDocsUrls,
          status: user.organizerVerification.status,
          reviewedAt: user.organizerVerification.reviewedAt?.toISOString() ?? null,
          reviewNote: user.organizerVerification.reviewNote,
        }
      : null,
  };
}
