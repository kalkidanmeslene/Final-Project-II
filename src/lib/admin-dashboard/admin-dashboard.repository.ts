import type { AuditAction, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_SETTINGS = {
  platformName: "Hibir Events",
  maintenanceMode: false,
  maxTicketsPerOrder: 10,
  supportEmail: "support@hibir.events",
  allowOrganizerSignup: true,
};

export async function getPlatformCounts() {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalOrganizers,
    activeOrganizers,
    suspendedUsers,
    pendingOrganizerApps,
    pendingEvents,
    pendingReviews,
    totalEvents,
    approvedEvents,
    totalBookings,
    successfulPayments,
    revenueAgg,
    ticketsSoldAgg,
    checkInsToday,
    transfersTotal,
    failedLogins24h,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "organizer" } }),
    prisma.user.count({ where: { role: "organizer", status: "active" } }),
    prisma.user.count({ where: { status: "suspended" } }),
    prisma.organizerVerification.count({ where: { status: "pending" } }),
    prisma.event.count({ where: { status: "pending" } }),
    prisma.eventReview.count({ where: { status: "pending" } }),
    prisma.event.count(),
    prisma.event.count({ where: { status: "approved" } }),
    prisma.booking.count({ where: { status: "confirmed" } }),
    prisma.payment.count({ where: { status: "successful" } }),
    prisma.payment.aggregate({ where: { status: "successful" }, _sum: { amount: true } }),
    prisma.event.aggregate({ _sum: { ticketsSold: true } }),
    prisma.ticket.count({
      where: { checkedInAt: { gte: dayStart }, status: "confirmed" },
    }),
    prisma.ticketTransfer.count(),
    prisma.auditLog.count({
      where: { action: "login_failed", createdAt: { gte: since24h } },
    }),
  ]);

  return {
    totalUsers,
    totalOrganizers,
    activeOrganizers,
    suspendedUsers,
    pendingOrganizerApps,
    pendingEvents,
    pendingReviews,
    totalEvents,
    approvedEvents,
    totalBookings,
    successfulPayments,
    totalRevenue: Number(revenueAgg._sum.amount ?? 0),
    ticketsSold: ticketsSoldAgg._sum.ticketsSold ?? 0,
    checkInsToday,
    transfersTotal,
    failedLogins24h,
  };
}

export async function getSalesByDay(days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const payments = await prisma.payment.findMany({
    where: { status: "successful", createdAt: { gte: since } },
    select: { createdAt: true, amount: true, bookingId: true },
  });

  const map = new Map<string, { revenue: number; bookings: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), { revenue: 0, bookings: 0 });
  }
  for (const p of payments) {
    const key = p.createdAt.toISOString().slice(0, 10);
    if (!map.has(key)) continue;
    const cur = map.get(key)!;
    cur.revenue += Number(p.amount);
    cur.bookings += 1;
  }
  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
}

export async function getUsersByRole() {
  const rows = await prisma.user.groupBy({ by: ["role"], _count: { role: true } });
  return rows.map((r) => ({ role: r.role, count: r._count.role }));
}

export async function getEventsByStatus() {
  const rows = await prisma.event.groupBy({ by: ["status"], _count: { status: true } });
  return rows.map((r) => ({ status: r.status, count: r._count.status }));
}

export async function listUsers(args: {
  role?: UserRole | "all";
  status?: string;
  q?: string;
  limit: number;
  offset: number;
}) {
  const where: Prisma.UserWhereInput = {};
  if (args.role && args.role !== "all") where.role = args.role;
  if (args.status && args.status !== "all") where.status = args.status as Prisma.EnumAccountStatusFilter;
  if (args.q) {
    where.OR = [
      { fullName: { contains: args.q, mode: "insensitive" } },
      { email: { contains: args.q, mode: "insensitive" } },
      { phoneNumber: { contains: args.q, mode: "insensitive" } },
      { organizerVerification: { organizationName: { contains: args.q, mode: "insensitive" } } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: args.limit,
      skip: args.offset,
      include: {
        organizerVerification: { select: { organizationName: true } },
        _count: { select: { organizedEvents: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function listAuditLogs(args: {
  action?: AuditAction;
  q?: string;
  limit: number;
  offset: number;
}) {
  const where: Prisma.AuditLogWhereInput = {};
  if (args.action) where.action = args.action;
  if (args.q) {
    where.OR = [
      { user: { fullName: { contains: args.q, mode: "insensitive" } } },
      { user: { email: { contains: args.q, mode: "insensitive" } } },
      { ipAddress: { contains: args.q } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: args.limit,
      skip: args.offset,
      include: { user: { select: { fullName: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

export async function listCategoriesWithCounts() {
  const categories = await prisma.eventCategory.findMany({ orderBy: { name: "asc" } });
  const counts = await prisma.event.groupBy({
    by: ["categoryId"],
    _count: { categoryId: true },
  });
  const countMap = new Map(counts.map((c) => [c.categoryId, c._count.categoryId]));
  return categories.map((c) => ({
    ...c,
    eventCount: countMap.get(c.id) ?? 0,
  }));
}

export async function createCategory(data: { name: string; slug: string; description?: string }) {
  return prisma.eventCategory.create({ data });
}

export async function updateCategory(id: string, data: Prisma.EventCategoryUpdateInput) {
  return prisma.eventCategory.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  return prisma.eventCategory.delete({ where: { id } });
}

export async function findCategoryBySlug(slug: string) {
  return prisma.eventCategory.findUnique({ where: { slug } });
}

export async function listLocations() {
  return prisma.eventLocation.findMany({ orderBy: [{ sortOrder: "asc" }, { city: "asc" }, { name: "asc" }] });
}

export async function createLocation(data: Prisma.EventLocationCreateInput) {
  return prisma.eventLocation.create({ data });
}

export async function updateLocation(id: string, data: Prisma.EventLocationUpdateInput) {
  return prisma.eventLocation.update({ where: { id }, data });
}

export async function deleteLocation(id: string) {
  return prisma.eventLocation.delete({ where: { id } });
}

export async function getSettingsRecord() {
  let row = await prisma.systemSetting.findUnique({ where: { key: "platform" } });
  if (!row) {
    row = await prisma.systemSetting.create({
      data: { key: "platform", value: DEFAULT_SETTINGS, description: "Platform-wide settings" },
    });
  }
  return row;
}

export async function updateSettings(value: Prisma.InputJsonValue, adminId: string) {
  return prisma.systemSetting.upsert({
    where: { key: "platform" },
    create: { key: "platform", value, updatedById: adminId },
    update: { value, updatedById: adminId },
  });
}

export async function writeAudit(args: {
  adminId: string;
  action: AuditAction;
  targetUserId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      action: args.action,
      userId: args.targetUserId ?? args.adminId,
      success: true,
      metadata: args.metadata,
      ipAddress: args.ipAddress,
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: { id: true, role: true, status: true } });
}
