import type { AccountStatus, OrganizerVerificationStatus, UserRole } from "@prisma/client";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  preferredLanguage: string;
  profilePictureUrl: string | null;
  role: UserRole;
  status: AccountStatus;
  organizerVerificationStatus: OrganizerVerificationStatus | null;
};

export type JwtAccessPayload = {
  sub: string; // userId
  role: UserRole;
  status: AccountStatus;
};

