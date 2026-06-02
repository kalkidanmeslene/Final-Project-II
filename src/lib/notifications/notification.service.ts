import type { NotificationType, Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { sendNotificationEmail } from "./email.service";
import { parseReminderHours, toNotificationDto, toPreferencesDto } from "./notification.mapper";
import {
  cancelScheduledRemindersForEvent,
  cancelScheduledRemindersForUserEvent,
  countUnreadNotifications,
  createNotification,
  findActiveAdmins,
  findDueScheduledNotifications,
  findEventForAnnouncement,
  findEventTicketHolderIds,
  findNotifications,
  findUserEmail,
  getOrCreatePreferences,
  markAllNotificationsRead,
  markNotificationRead,
  markScheduledProcessed,
  updateNotificationEmailStatus,
  updatePreferences,
  upsertScheduledReminder,
} from "./notification.repository";
import { findBookingById } from "@/lib/booking/booking.repository";
import type {
  EmailAttachment,
  EmailTemplateContext,
  NotificationListResult,
  NotificationPreferencesDto,
} from "./notification.types";
import { buildTicketQrAttachments } from "./ticket-qr-email";

type PreferenceKey =
  | "bookingEmail"
  | "reminderEmail"
  | "eventUpdateEmail"
  | "cancellationEmail"
  | "transferEmail"
  | "announcementEmail";

function preferenceKeyForType(type: NotificationType): PreferenceKey | null {
  switch (type) {
    case "booking_confirmed":
    case "booking_failed":
      return "bookingEmail";
    case "event_reminder":
      return "reminderEmail";
    case "event_updated":
    case "event_postponed":
    case "event_approved":
    case "event_rejected":
    case "event_submitted":
    case "event_completed":
      return "eventUpdateEmail";
    case "event_cancelled":
      return "cancellationEmail";
    case "ticket_transferred":
    case "ticket_received":
      return "transferEmail";
    case "organizer_announcement":
      return "announcementEmail";
    default:
      return null;
  }
}

function shouldSendEmail(type: NotificationType, pref: NotificationPreferencesDto) {
  if (!pref.emailEnabled) return false;
  const key = preferenceKeyForType(type);
  if (!key) return pref.emailEnabled;
  return pref[key];
}

function buildEmailContext(args: {
  userName: string;
  title: string;
  body: string;
  eventTitle?: string;
  eventSlug?: string;
}) {
  const base = env.APP_BASE_URL ?? "http://localhost:3000";
  return {
    userName: args.userName,
    title: args.title,
    body: args.body,
    eventTitle: args.eventTitle,
    eventUrl: args.eventSlug ? `${base}/events/${args.eventSlug}` : undefined,
    ticketsUrl: `${base}/dashboard/attendee/tickets`,
  };
}

export async function dispatchNotification(args: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  eventId?: string;
  metadata?: Prisma.InputJsonValue;
  eventTitle?: string;
  eventSlug?: string;
  emailContextExtra?: Partial<EmailTemplateContext>;
  emailAttachments?: EmailAttachment[];
}) {
  const prefRow = await getOrCreatePreferences(args.userId);
  const pref = toPreferencesDto(prefRow);

  let notification = null;
  if (pref.inAppEnabled) {
    notification = await createNotification({
      user: { connect: { id: args.userId } },
      type: args.type,
      title: args.title,
      body: args.body,
      ...(args.eventId ? { event: { connect: { id: args.eventId } } } : {}),
      metadata: args.metadata,
      emailStatus: shouldSendEmail(args.type, pref) ? "pending" : "skipped",
    });
  }

  const user = await findUserEmail(args.userId);
  if (!user?.email || !shouldSendEmail(args.type, pref)) {
    if (notification && notification.emailStatus === "pending") {
      await updateNotificationEmailStatus(notification.id, "skipped");
    }
    return notification;
  }

  const emailResult = await sendNotificationEmail({
    to: user.email,
    type: args.type,
    context: {
      ...buildEmailContext({
        userName: user.fullName,
        title: args.title,
        body: args.body,
        eventTitle: args.eventTitle,
        eventSlug: args.eventSlug,
      }),
      ...args.emailContextExtra,
    },
    attachments: args.emailAttachments,
  });

  if (!emailResult.ok) {
    console.error(
      `[notification] Email failed type=${args.type} userId=${args.userId} to=${user.email}:`,
      emailResult.error,
    );
  }

  if (notification) {
    await updateNotificationEmailStatus(notification.id, emailResult.ok ? "sent" : "failed");
  } else if (emailResult.ok) {
    await createNotification({
      user: { connect: { id: args.userId } },
      type: args.type,
      title: args.title,
      body: args.body,
      ...(args.eventId ? { event: { connect: { id: args.eventId } } } : {}),
      metadata: args.metadata,
      emailStatus: "sent",
      emailSentAt: new Date(),
    });
  }

  return notification;
}

export async function notifyUser(args: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  eventId?: string;
  metadata?: Prisma.InputJsonValue;
  eventTitle?: string;
  eventSlug?: string;
  emailContextExtra?: Partial<EmailTemplateContext>;
  emailAttachments?: EmailAttachment[];
}) {
  return dispatchNotification(args);
}

export async function notifyBookingConfirmed(args: {
  userId: string;
  bookingId: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  quantity: number;
}) {
  const booking = await findBookingById(args.bookingId);
  const tickets = booking?.tickets ?? [];

  let emailAttachments: EmailAttachment[] | undefined;
  let emailContextExtra: Partial<EmailTemplateContext> | undefined;

  if (tickets.length > 0) {
    const qrAttachments = await buildTicketQrAttachments(
      tickets.map((t) => ({
        id: t.id,
        ticketCode: t.ticketCode,
        ticketTypeName: t.ticketType.name,
        eventId: t.eventId,
        eventEndsAt: t.event.endsAt,
        qrVersion: t.qrVersion,
      })),
    );

    emailAttachments = qrAttachments.map((q) => ({
      filename: `ticket-${q.ticketCode}.png`,
      content: q.buffer,
      cid: q.cid,
    }));

    emailContextExtra = {
      tickets: qrAttachments.map((q) => ({
        ticketCode: q.ticketCode,
        ticketTypeName: q.ticketTypeName,
        qrCid: q.cid,
      })),
    };
  }

  return notifyUser({
    userId: args.userId,
    type: "booking_confirmed",
    title: "Tickets confirmed",
    body: `${args.quantity} ticket(s) for "${args.eventTitle}" — your QR code(s) are below.`,
    eventId: args.eventId,
    eventTitle: args.eventTitle,
    eventSlug: args.eventSlug,
    emailContextExtra,
    emailAttachments,
  });
}

export async function notifyAdmins(args: {
  type: NotificationType;
  title: string;
  body: string;
  eventId?: string;
  metadata?: Prisma.InputJsonValue;
  eventTitle?: string;
  eventSlug?: string;
}) {
  const admins = await findActiveAdmins();
  await Promise.all(
    admins.map((a) =>
      dispatchNotification({
        userId: a.id,
        type: args.type,
        title: args.title,
        body: args.body,
        eventId: args.eventId,
        metadata: args.metadata,
        eventTitle: args.eventTitle,
        eventSlug: args.eventSlug,
      }),
    ),
  );
}

export async function notifyEventAttendees(args: {
  eventId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Prisma.InputJsonValue;
  excludeUserId?: string;
  eventTitle?: string;
  eventSlug?: string;
  emailContextExtra?: Partial<EmailTemplateContext>;
}) {
  const userIds = await findEventTicketHolderIds(args.eventId, args.excludeUserId);
  await Promise.all(
    userIds.map((userId) =>
      dispatchNotification({
        userId,
        type: args.type,
        title: args.title,
        body: args.body,
        eventId: args.eventId,
        metadata: args.metadata,
        eventTitle: args.eventTitle,
        eventSlug: args.eventSlug,
        emailContextExtra: args.emailContextExtra,
      }),
    ),
  );
}

export async function listUserNotifications(args: {
  userId: string;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<NotificationListResult> {
  const limit = args.limit ?? 20;
  const offset = args.offset ?? 0;
  const { notifications, total, unreadCount } = await findNotifications({
    userId: args.userId,
    limit,
    offset,
    unreadOnly: args.unreadOnly,
  });
  const nextOffset = offset + notifications.length;
  return {
    notifications: notifications.map(toNotificationDto),
    total,
    unreadCount,
    limit,
    offset,
    hasMore: nextOffset < total,
    nextOffset: nextOffset < total ? nextOffset : null,
  };
}

export async function getUnreadCount(userId: string) {
  const count = await countUnreadNotifications(userId);
  return { unreadCount: count };
}

export async function markRead(userId: string, notificationId: string) {
  const updated = await markNotificationRead(userId, notificationId);
  if (!updated) return { ok: false as const, code: "NOT_FOUND" as const };
  return { ok: true as const };
}

export async function markAllRead(userId: string) {
  const count = await markAllNotificationsRead(userId);
  return { marked: count };
}

export async function getPreferences(userId: string): Promise<NotificationPreferencesDto> {
  const pref = await getOrCreatePreferences(userId);
  return toPreferencesDto(pref);
}

export async function savePreferences(userId: string, input: Partial<NotificationPreferencesDto>) {
  const data: Prisma.NotificationPreferenceUpdateInput = {};
  if (input.inAppEnabled !== undefined) data.inAppEnabled = input.inAppEnabled;
  if (input.emailEnabled !== undefined) data.emailEnabled = input.emailEnabled;
  if (input.bookingEmail !== undefined) data.bookingEmail = input.bookingEmail;
  if (input.reminderEmail !== undefined) data.reminderEmail = input.reminderEmail;
  if (input.eventUpdateEmail !== undefined) data.eventUpdateEmail = input.eventUpdateEmail;
  if (input.cancellationEmail !== undefined) data.cancellationEmail = input.cancellationEmail;
  if (input.transferEmail !== undefined) data.transferEmail = input.transferEmail;
  if (input.announcementEmail !== undefined) data.announcementEmail = input.announcementEmail;
  if (input.reminderHoursBefore !== undefined) data.reminderHoursBefore = input.reminderHoursBefore;

  const updated = await updatePreferences(userId, data);
  return toPreferencesDto(updated);
}

export async function scheduleEventReminders(args: {
  userId: string;
  eventId: string;
  startsAt: Date;
}) {
  const pref = toPreferencesDto(await getOrCreatePreferences(args.userId));
  if (!pref.reminderEmail && !pref.inAppEnabled) return;

  const hours = parseReminderHours(pref.reminderHoursBefore);
  const now = Date.now();

  for (const hoursBefore of hours) {
    const scheduledFor = new Date(args.startsAt.getTime() - hoursBefore * 60 * 60 * 1000);
    if (scheduledFor.getTime() <= now) continue;

    await upsertScheduledReminder({
      userId: args.userId,
      eventId: args.eventId,
      type: "event_reminder",
      scheduledFor,
      metadata: { hoursBefore },
    });
  }
}

export async function rescheduleEventReminders(args: {
  eventId: string;
  startsAt: Date;
}) {
  await cancelScheduledRemindersForEvent(args.eventId);

  const holders = await findEventTicketHolderIds(args.eventId);
  await Promise.all(
    holders.map((userId) =>
      scheduleEventReminders({ userId, eventId: args.eventId, startsAt: args.startsAt }),
    ),
  );
}

export async function cancelEventReminders(eventId: string) {
  return cancelScheduledRemindersForEvent(eventId);
}

export async function processDueScheduledNotifications() {
  const due = await findDueScheduledNotifications();
  let processed = 0;

  for (const item of due) {
    if (item.event.status === "cancelled" || item.event.status === "completed") {
      await markScheduledProcessed(item.id);
      continue;
    }

    const hoursBefore = (item.metadata as { hoursBefore?: number } | null)?.hoursBefore;
    const when =
      hoursBefore && hoursBefore >= 24
        ? `in ${Math.round(hoursBefore / 24)} day(s)`
        : hoursBefore
          ? `in ${hoursBefore} hour(s)`
          : "soon";

    await dispatchNotification({
      userId: item.userId,
      type: "event_reminder",
      title: "Event reminder",
      body: `"${item.event.title}" starts ${when} at ${item.event.venue}, ${item.event.location}.`,
      eventId: item.eventId,
      eventTitle: item.event.title,
      eventSlug: item.event.slug,
      metadata: { scheduledNotificationId: item.id, hoursBefore },
    });

    await markScheduledProcessed(item.id);
    processed += 1;
  }

  return { processed, scanned: due.length };
}

export async function sendOrganizerAnnouncement(args: {
  eventId: string;
  organizerId: string;
  role: "organizer" | "admin";
  title: string;
  message: string;
}) {
  const event = await findEventForAnnouncement(args.eventId);
  if (!event) return { ok: false as const, code: "NOT_FOUND" as const };
  if (args.role !== "admin" && event.organizerId !== args.organizerId) {
    return { ok: false as const, code: "FORBIDDEN" as const };
  }
  if (event.status !== "approved") {
    return { ok: false as const, code: "INVALID_STATUS" as const, message: "Only approved events can send announcements." };
  }

  await notifyEventAttendees({
    eventId: event.id,
    type: "organizer_announcement",
    title: args.title,
    body: args.message,
    excludeUserId: args.organizerId,
    eventTitle: event.title,
    eventSlug: event.slug,
    metadata: { announcement: true },
  });

  return { ok: true as const, recipients: await findEventTicketHolderIds(event.id, args.organizerId) };
}

// Backward-compatible export used by booking service
export { cancelScheduledRemindersForUserEvent };
