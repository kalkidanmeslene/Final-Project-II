import type { EmailDeliveryStatus, NotificationType } from "@prisma/client";

export type NotificationDto = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  readAt: string | null;
  eventId: string | null;
  metadata: Record<string, unknown> | null;
  emailStatus: EmailDeliveryStatus | null;
  createdAt: string;
  event?: { id: string; title: string; slug: string } | null;
};

export type NotificationListResult = {
  notifications: NotificationDto[];
  total: number;
  unreadCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
};

export type NotificationPreferencesDto = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  bookingEmail: boolean;
  reminderEmail: boolean;
  eventUpdateEmail: boolean;
  cancellationEmail: boolean;
  transferEmail: boolean;
  announcementEmail: boolean;
  reminderHoursBefore: number[];
};

export type TicketEmailItem = {
  ticketCode: string;
  ticketTypeName: string;
  qrCid: string;
};

export type EventScheduleEmail = {
  dateTime: string;
  venue?: string;
  location?: string;
  previousDateTime?: string;
  previousVenue?: string;
  previousLocation?: string;
  reason?: string;
};

export type EmailTemplateContext = {
  userName: string;
  title: string;
  body: string;
  eventTitle?: string;
  eventUrl?: string;
  ticketsUrl?: string;
  tickets?: TicketEmailItem[];
  eventSchedule?: EventScheduleEmail;
};

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  cid: string;
};

export const DEFAULT_REMINDER_HOURS = [24, 2] as const;
