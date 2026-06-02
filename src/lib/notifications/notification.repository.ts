import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_REMINDER_HOURS } from "./notification.types";

export async function getOrCreatePreferences(userId: string) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, reminderHoursBefore: [...DEFAULT_REMINDER_HOURS] },
    update: {},
  });
}

export async function updatePreferences(userId: string, data: Prisma.NotificationPreferenceUpdateInput) {
  await getOrCreatePreferences(userId);
  return prisma.notificationPreference.update({ where: { userId }, data });
}

export async function findNotifications(args: {
  userId: string;
  limit: number;
  offset: number;
  unreadOnly?: boolean;
}) {
  const where: Prisma.NotificationWhereInput = {
    userId: args.userId,
    ...(args.unreadOnly ? { readAt: null } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: args.limit,
      skip: args.offset,
      include: {
        event: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: args.userId, readAt: null } }),
  ]);

  return { notifications, total, unreadCount };
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}

export async function createNotification(data: Prisma.NotificationCreateInput) {
  return prisma.notification.create({ data });
}

export async function updateNotificationEmailStatus(
  notificationId: string,
  status: "sent" | "failed" | "skipped",
) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      emailStatus: status,
      emailSentAt: status === "sent" ? new Date() : undefined,
    },
  });
}

export async function findUserEmail(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, preferredLanguage: true },
  });
}

export async function findEventTicketHolderIds(eventId: string, excludeUserId?: string) {
  const rows = await prisma.ticket.findMany({
    where: {
      eventId,
      status: "confirmed",
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.map((r) => r.userId);
}

export async function findActiveAdmins() {
  return prisma.user.findMany({
    where: { role: "admin", status: "active" },
    select: { id: true },
  });
}

export async function upsertScheduledReminder(args: {
  userId: string;
  eventId: string;
  type: NotificationType;
  scheduledFor: Date;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.scheduledNotification.upsert({
    where: {
      userId_eventId_type_scheduledFor: {
        userId: args.userId,
        eventId: args.eventId,
        type: args.type,
        scheduledFor: args.scheduledFor,
      },
    },
    create: {
      userId: args.userId,
      eventId: args.eventId,
      type: args.type,
      scheduledFor: args.scheduledFor,
      metadata: args.metadata,
    },
    update: { cancelledAt: null },
  });
}

export async function cancelScheduledRemindersForEvent(eventId: string) {
  return prisma.scheduledNotification.updateMany({
    where: { eventId, type: "event_reminder", processedAt: null, cancelledAt: null },
    data: { cancelledAt: new Date() },
  });
}

export async function cancelScheduledRemindersForUserEvent(userId: string, eventId: string) {
  return prisma.scheduledNotification.updateMany({
    where: { userId, eventId, type: "event_reminder", processedAt: null, cancelledAt: null },
    data: { cancelledAt: new Date() },
  });
}

export async function findDueScheduledNotifications(limit = 100) {
  const now = new Date();
  return prisma.scheduledNotification.findMany({
    where: {
      scheduledFor: { lte: now },
      processedAt: null,
      cancelledAt: null,
    },
    orderBy: { scheduledFor: "asc" },
    take: limit,
    include: {
      event: { select: { id: true, title: true, slug: true, startsAt: true, venue: true, location: true, status: true } },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });
}

export async function markScheduledProcessed(id: string) {
  return prisma.scheduledNotification.update({
    where: { id },
    data: { processedAt: new Date() },
  });
}

export async function findEventForAnnouncement(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, slug: true, organizerId: true, status: true },
  });
}
