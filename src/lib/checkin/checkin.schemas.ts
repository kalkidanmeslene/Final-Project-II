import { z } from "zod";

export const scanPayloadSchema = z.object({
  payload: z.string().min(10, "QR payload is required."),
});

export const scanHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().uuid().optional(),
});

export const addStaffSchema = z.object({
  email: z.string().email("Valid email required."),
  role: z.enum(["scanner", "manager"]).default("scanner"),
});
