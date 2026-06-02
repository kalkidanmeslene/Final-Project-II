import { z } from "zod";

export const adminUserListSchema = z.object({
  role: z.enum(["organizer", "admin", "attendee", "all"]).optional().default("organizer"),
  status: z.enum(["active", "pending", "suspended", "all"]).optional().default("all"),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const adminAuditListSchema = z.object({
  action: z.string().optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional(),
});

export const locationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  region: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional().default("Ethiopia"),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const settingsSchema = z.object({
  platformName: z.string().trim().min(2).max(80).optional(),
  maintenanceMode: z.boolean().optional(),
  maxTicketsPerOrder: z.coerce.number().int().min(1).max(50).optional(),
  supportEmail: z.string().email().optional(),
  allowOrganizerSignup: z.boolean().optional(),
});

export const moderationNoteSchema = z.object({
  note: z.string().trim().max(500).optional(),
});
