import { z } from "zod";

export const reportsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  days: z.coerce.number().int().min(7).max(365).optional().default(30),
});

export const reportsExportSchema = reportsQuerySchema.extend({
  type: z
    .enum([
      "summary",
      "ticket_sales",
      "attendance",
      "event_popularity",
      "organizer_performance",
      "revenue",
      "validation",
      "user_growth",
      "transfers",
      "full",
    ])
    .default("full"),
  format: z.enum(["csv", "pdf"]).default("csv"),
});
