import { z } from "zod";

export const categorySuggestSchema = z.object({
  description: z.string().trim().min(20).max(8000),
  title: z.string().trim().max(200).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  async: z.boolean().optional().default(false),
});

export const translateSchema = z.object({
  text: z.string().trim().min(1).max(8000),
  fromLang: z.enum(["en", "am"]),
  toLang: z.enum(["en", "am"]),
  async: z.boolean().optional().default(false),
});

export const createAiJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("category_suggestion"),
    description: z.string().trim().min(20).max(8000),
    title: z.string().trim().max(200).optional(),
    categoryIds: z.array(z.string().uuid()).optional(),
  }),
  z.object({
    type: z.literal("translation"),
    text: z.string().trim().min(1).max(8000),
    fromLang: z.enum(["en", "am"]),
    toLang: z.enum(["en", "am"]),
  }),
]);
