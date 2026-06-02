import type { AccountStatus, UserRole } from "@prisma/client";

const ROLE_RANK: Record<UserRole, number> = {
  attendee: 1,
  organizer: 2,
  admin: 3,
};

export function hasMinimumRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

export function canAccessDashboard(userRole: UserRole, dashboard: "attendee" | "organizer" | "admin"): boolean {
  if (dashboard === "admin") return userRole === "admin";
  if (dashboard === "organizer") return userRole === "organizer" || userRole === "admin";
  return true;
}

export function defaultDashboardPath(role: UserRole, status?: AccountStatus): string {
  if (role === "organizer" && status === "pending") {
    return "/pending";
  }
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "organizer":
      return "/dashboard/organizer";
    default:
      return "/dashboard/attendee";
  }
}
