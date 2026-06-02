import { z } from "zod";

export const MAX_TICKETS_PER_ORDER = 20;

export const checkoutLineSchema = z.object({
  ticketTypeId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(20),
});

function validateCheckoutLines(lines: { quantity: number }[], ctx: z.RefinementCtx) {
  const total = lines.reduce((sum, line) => sum + line.quantity, 0);
  if (total < 1) {
    ctx.addIssue({
      code: "custom",
      message: "Select at least one ticket.",
      path: ["lines"],
    });
  }
  if (total > MAX_TICKETS_PER_ORDER) {
    ctx.addIssue({
      code: "custom",
      message: `Maximum ${MAX_TICKETS_PER_ORDER} tickets per order.`,
      path: ["lines"],
    });
  }
}

export const checkoutPreviewSchema = z
  .object({
    lines: z.array(checkoutLineSchema).min(1),
  })
  .superRefine((val, ctx) => validateCheckoutLines(val.lines, ctx));

export const completeCheckoutSchema = z
  .object({
    lines: z.array(checkoutLineSchema).min(1),
    paymentResult: z.enum(["success", "fail"]),
  })
  .superRefine((val, ctx) => validateCheckoutLines(val.lines, ctx));
