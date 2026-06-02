import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Comment must be at least 10 characters.").max(1000),
  ticketId: z.string().uuid().optional(),
});

export const reviewListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(["approved", "pending", "rejected", "flagged", "all"]).optional().default("approved"),
});

export const moderateReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "flagged"]),
  note: z.string().trim().max(500).optional(),
});
