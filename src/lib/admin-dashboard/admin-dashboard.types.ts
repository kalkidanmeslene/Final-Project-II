import type { AuditAction, AccountStatus, UserRole } from "@prisma/client";

export type AdminOverview = {
  totalUsers: number;
  totalOrganizers: number;
  activeOrganizers: number;
  suspendedUsers: number;
  pendingOrganizerApps: number;
  pendingEvents: number;
  pendingReviews: number;
  totalEvents: number;
  approvedEvents: number;
  totalBookings: number;
  successfulPayments: number;
  totalRevenue: number;
  ticketsSold: number;
  checkInsToday: number;
  transfersTotal: number;
  failedLogins24h: number;
  systemStatus: "healthy" | "degraded" | "maintenance";
};

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  role: UserRole;
  status: AccountStatus;
  organizationName: string | null;
  eventsCount: number;
  createdAt: string;
  suspendedAt: string | null;
};

export type AdminOrganizerApplication = {
  userId: string;
  fullName: string;
  email: string | null;
  organizationName: string;
  organizationWebsite: string | null;
  createdAt: string;
};

export type AdminAuditRow = {
  id: string;
  action: AuditAction;
  success: boolean;
  userId: string | null;
  userName: string | null;
  ipAddress: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  eventCount: number;
};

export type AdminLocationRow = {
  id: string;
  name: string;
  city: string;
  region: string | null;
  country: string;
  isActive: boolean;
  sortOrder: number;
};

export type PlatformSettings = {
  platformName: string;
  maintenanceMode: boolean;
  maxTicketsPerOrder: number;
  supportEmail: string;
  allowOrganizerSignup: boolean;
};

export type AdminDashboardData = {
  overview: AdminOverview;
  salesByDay: { date: string; revenue: number; bookings: number }[];
  usersByRole: { role: string; count: number }[];
  eventsByStatus: { status: string; count: number }[];
  recentAudit: AdminAuditRow[];
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
};
