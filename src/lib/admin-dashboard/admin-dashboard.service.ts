import type { AuditAction, Prisma, UserRole } from "@prisma/client";
import { adminApproveOrganizer, adminRejectOrganizer, adminSuspendUser, adminUnsuspendUser } from "@/lib/auth/auth.service";
import { listPendingOrganizers } from "@/lib/auth/auth.repository";
import { adminApproveEvent, adminRejectEvent, getPendingEventsForAdmin } from "@/lib/events/event.service";
import { slugify } from "@/lib/events/slug";
import type {
  AdminCategoryRow,
  AdminDashboardData,
  AdminLocationRow,
  AdminOrganizerApplication,
  AdminUserRow,
  PaginatedResult,
  PlatformSettings,
} from "./admin-dashboard.types";
import {
  createCategory,
  createLocation,
  deleteCategory,
  deleteLocation,
  findCategoryBySlug,
  findUserById,
  getEventsByStatus,
  getPlatformCounts,
  getSalesByDay,
  getSettingsRecord,
  getUsersByRole,
  listAuditLogs,
  listCategoriesWithCounts,
  listLocations,
  listUsers,
  updateCategory,
  updateLocation,
  updateSettings,
  writeAudit,
} from "./admin-dashboard.repository";

function paginate<T>(items: T[], total: number, limit: number, offset: number): PaginatedResult<T> {
  const nextOffset = offset + items.length;
  return {
    items,
    total,
    limit,
    offset,
    hasMore: nextOffset < total,
    nextOffset: nextOffset < total ? nextOffset : null,
  };
}

export async function buildAdminDashboard(): Promise<AdminDashboardData> {
  const counts = await getPlatformCounts();
  const maintenance = await getSettingsRecord();
  const maintenanceMode = Boolean((maintenance.value as PlatformSettings).maintenanceMode);

  let systemStatus: AdminDashboardData["overview"]["systemStatus"] = "healthy";
  if (maintenanceMode) systemStatus = "maintenance";
  else if (counts.failedLogins24h > 50 || counts.pendingEvents > 20) systemStatus = "degraded";

  const [salesByDay, usersByRole, eventsByStatus, recentLogs] = await Promise.all([
    getSalesByDay(30),
    getUsersByRole(),
    getEventsByStatus(),
    listAuditLogs({ limit: 10, offset: 0 }),
  ]);

  return {
    overview: { ...counts, systemStatus },
    salesByDay,
    usersByRole,
    eventsByStatus,
    recentAudit: recentLogs.logs.map((l) => ({
      id: l.id,
      action: l.action,
      success: l.success,
      userId: l.userId,
      userName: l.user?.fullName ?? null,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
      metadata: (l.metadata as Record<string, unknown> | null) ?? null,
    })),
  };
}

export async function listAdminUsers(params: {
  role?: string;
  status?: string;
  q?: string;
  limit: number;
  offset: number;
}): Promise<PaginatedResult<AdminUserRow>> {
  const { users, total } = await listUsers({
    role: params.role === "all" ? undefined : (params.role as UserRole),
    status: params.status,
    q: params.q,
    limit: params.limit,
    offset: params.offset,
  });

  const items: AdminUserRow[] = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phoneNumber: u.phoneNumber,
    role: u.role,
    status: u.status,
    organizationName: u.organizerVerification?.organizationName ?? null,
    eventsCount: u._count.organizedEvents,
    createdAt: u.createdAt.toISOString(),
    suspendedAt: u.suspendedAt?.toISOString() ?? null,
  }));

  return paginate(items, total, params.limit, params.offset);
}

export async function listOrganizerApplications(): Promise<AdminOrganizerApplication[]> {
  const pending = await listPendingOrganizers();
  return pending.map((p) => ({
    userId: p.userId,
    fullName: p.user.fullName,
    email: p.user.email,
    organizationName: p.organizationName,
    organizationWebsite: p.organizationWebsite,
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function listPendingEventsAdmin() {
  return getPendingEventsForAdmin();
}

const AUDIT_ACTIONS = new Set<string>([
  "register",
  "organizer_request",
  "organizer_approved",
  "organizer_rejected",
  "login_success",
  "login_failed",
  "logout",
  "forgot_password",
  "reset_password",
  "suspend_account",
  "unsuspend_account",
  "profile_updated",
  "password_changed",
  "profile_picture_uploaded",
  "ticket_transferred",
  "event_approved",
  "event_rejected",
  "category_created",
  "category_updated",
  "category_deleted",
  "location_created",
  "location_updated",
  "location_deleted",
  "settings_updated",
]);

export async function listAdminAuditLogs(params: {
  action?: string;
  q?: string;
  limit: number;
  offset: number;
}) {
  const actionFilter =
    params.action && AUDIT_ACTIONS.has(params.action) ? (params.action as AuditAction) : undefined;
  const { logs, total } = await listAuditLogs({
    action: actionFilter,
    q: params.q,
    limit: params.limit,
    offset: params.offset,
  });

  const items = logs.map((l) => ({
    id: l.id,
    action: l.action,
    success: l.success,
    userId: l.userId,
    userName: l.user?.fullName ?? null,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
    metadata: (l.metadata as Record<string, unknown> | null) ?? null,
  }));

  return paginate(items, total, params.limit, params.offset);
}

export async function getCategoriesAdmin(): Promise<AdminCategoryRow[]> {
  const rows = await listCategoriesWithCounts();
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    eventCount: c.eventCount,
  }));
}

export async function getLocationsAdmin(): Promise<AdminLocationRow[]> {
  const rows = await listLocations();
  return rows.map((l) => ({
    id: l.id,
    name: l.name,
    city: l.city,
    region: l.region,
    country: l.country,
    isActive: l.isActive,
    sortOrder: l.sortOrder,
  }));
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const row = await getSettingsRecord();
  return row.value as PlatformSettings;
}

export async function savePlatformSettings(adminId: string, patch: Partial<PlatformSettings>) {
  const current = await getPlatformSettings();
  const next = { ...current, ...patch };
  await updateSettings(next as Prisma.InputJsonValue, adminId);
  await writeAudit({
    adminId,
    action: "settings_updated",
    metadata: { keys: Object.keys(patch) },
  });
  return next;
}

export async function createCategoryAdmin(adminId: string, data: { name: string; slug?: string; description?: string }) {
  const slug = data.slug?.trim() || slugify(data.name);
  const exists = await findCategoryBySlug(slug);
  if (exists) return { ok: false as const, code: "DUPLICATE" as const, message: "Slug already exists." };
  const cat = await createCategory({
    name: data.name,
    slug,
    ...(data.description ? { description: data.description } : {}),
  });
  await writeAudit({ adminId, action: "category_created", metadata: { categoryId: cat.id, name: cat.name } });
  return { ok: true as const, category: cat };
}

export async function updateCategoryAdmin(
  adminId: string,
  id: string,
  data: { name?: string; slug?: string; description?: string },
) {
  const cat = await updateCategory(id, data);
  await writeAudit({ adminId, action: "category_updated", metadata: { categoryId: id } });
  return cat;
}

export async function deleteCategoryAdmin(adminId: string, id: string) {
  const cat = await deleteCategory(id);
  await writeAudit({ adminId, action: "category_deleted", metadata: { categoryId: id, name: cat.name } });
  return cat;
}

export async function createLocationAdmin(
  adminId: string,
  data: { name: string; city: string; region?: string; country?: string; isActive?: boolean; sortOrder?: number },
) {
  const loc = await createLocation({
    name: data.name,
    city: data.city,
    region: data.region ?? null,
    country: data.country ?? "Ethiopia",
    isActive: data.isActive ?? true,
    sortOrder: data.sortOrder ?? 0,
  });
  await writeAudit({ adminId, action: "location_created", metadata: { locationId: loc.id } });
  return loc;
}

export async function updateLocationAdmin(adminId: string, id: string, data: Record<string, unknown>) {
  const loc = await updateLocation(id, data);
  await writeAudit({ adminId, action: "location_updated", metadata: { locationId: id } });
  return loc;
}

export async function deleteLocationAdmin(adminId: string, id: string) {
  const loc = await deleteLocation(id);
  await writeAudit({ adminId, action: "location_deleted", metadata: { locationId: id } });
  return loc;
}

export async function suspendUserAdmin(adminId: string, userId: string) {
  const user = await findUserById(userId);
  if (!user) return { ok: false as const, code: "NOT_FOUND" as const };
  if (user.role === "admin") return { ok: false as const, code: "FORBIDDEN" as const, message: "Cannot suspend admins." };
  if (user.id === adminId) return { ok: false as const, code: "FORBIDDEN" as const, message: "Cannot suspend yourself." };
  await adminSuspendUser({ userId, adminUserId: adminId });
  return { ok: true as const };
}

export async function unsuspendUserAdmin(adminId: string, userId: string) {
  const user = await findUserById(userId);
  if (!user) return { ok: false as const, code: "NOT_FOUND" as const };
  await adminUnsuspendUser({ userId, adminUserId: adminId });
  return { ok: true as const };
}

export async function approveOrganizerAdmin(adminId: string, userId: string, note?: string) {
  await adminApproveOrganizer({ userId, adminUserId: adminId, note: note ?? null });
  return { ok: true as const };
}

export async function rejectOrganizerAdmin(adminId: string, userId: string, note?: string) {
  await adminRejectOrganizer({ userId, adminUserId: adminId, note: note ?? null });
  return { ok: true as const };
}

export async function approveEventAdmin(adminId: string, eventId: string, note?: string) {
  const result = await adminApproveEvent({ eventId, adminId, note });
  if (result.ok) {
    await writeAudit({ adminId, action: "event_approved", metadata: { eventId } });
  }
  return result;
}

export async function rejectEventAdmin(adminId: string, eventId: string, note?: string) {
  const result = await adminRejectEvent({ eventId, adminId, note });
  if (result.ok) {
    await writeAudit({ adminId, action: "event_rejected", metadata: { eventId } });
  }
  return result;
}
