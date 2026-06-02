import { z } from "zod";

export const eventSortSchema = z.enum(["date", "price_asc", "price_desc", "popularity"]);

export const eventSearchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  free: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  sort: eventSortSchema.optional().default("date"),
  limit: z.coerce.number().int().min(1).max(48).optional().default(12),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export function parseDateParam(value?: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
