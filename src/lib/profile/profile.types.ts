import type { AccountStatus, OrganizerVerificationStatus, UserRole } from "@prisma/client";

export type OrganizerProfileInfo = {
  organizationName: string;
  organizationWebsite: string | null;
  organizationAddress: string | null;
  organizationPhone: string | null;
  verificationDocsUrls: string[];
  status: OrganizerVerificationStatus;
  reviewedAt: string | null;
  reviewNote: string | null;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  preferredLanguage: string;
  profilePictureUrl: string | null;
  bio: string | null;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  organizer: OrganizerProfileInfo | null;
};
