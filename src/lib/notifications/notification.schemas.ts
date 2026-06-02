import { z } from "zod";

export const notificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  unreadOnly: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export const notificationPreferencesSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  bookingEmail: z.boolean().optional(),
  reminderEmail: z.boolean().optional(),
  eventUpdateEmail: z.boolean().optional(),
  cancellationEmail: z.boolean().optional(),
  transferEmail: z.boolean().optional(),
  announcementEmail: z.boolean().optional(),
  reminderHoursBefore: z.array(z.coerce.number().int().min(1).max(168)).min(1).max(5).optional(),
});

export const organizerAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(5).max(2000),
});
