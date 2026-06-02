import type { Notification, NotificationPreference } from "@prisma/client";
import type { NotificationDto, NotificationPreferencesDto } from "./notification.types";
import { DEFAULT_REMINDER_HOURS } from "./notification.types";

export function toNotificationDto(
  row: Notification & { event?: { id: string; title: string; slug: string } | null },
): NotificationDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    read: row.readAt != null,
    readAt: row.readAt?.toISOString() ?? null,
    eventId: row.eventId,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    emailStatus: row.emailStatus,
    createdAt: row.createdAt.toISOString(),
    event: row.event ?? null,
  };
}

export function parseReminderHours(value: unknown): number[] {
  if (Array.isArray(value)) {
    const nums = value.filter((v): v is number => typeof v === "number" && v > 0);
    if (nums.length > 0) return nums;
  }
  return [...DEFAULT_REMINDER_HOURS];
}

export function toPreferencesDto(pref: NotificationPreference): NotificationPreferencesDto {
  return {
    inAppEnabled: pref.inAppEnabled,
    emailEnabled: pref.emailEnabled,
    bookingEmail: pref.bookingEmail,
    reminderEmail: pref.reminderEmail,
    eventUpdateEmail: pref.eventUpdateEmail,
    cancellationEmail: pref.cancellationEmail,
    transferEmail: pref.transferEmail,
    announcementEmail: pref.announcementEmail,
    reminderHoursBefore: parseReminderHours(pref.reminderHoursBefore),
  };
}
