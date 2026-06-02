import { z } from "zod";

const recipientFields = {
  recipientEmail: z.string().email("Enter a valid email for the recipient.").optional(),
  recipientPhone: z.string().min(7).max(20).optional(),
};

function refineRecipient(
  val: { recipientEmail?: string; recipientPhone?: string },
  ctx: z.RefinementCtx,
) {
  const hasEmail = !!val.recipientEmail?.trim();
  const hasPhone = !!val.recipientPhone?.trim();
  if (!hasEmail && !hasPhone) {
    ctx.addIssue({
      code: "custom",
      message: "Recipient email or phone is required.",
      path: ["recipientEmail"],
    });
  }
  if (hasEmail && hasPhone) {
    ctx.addIssue({
      code: "custom",
      message: "Provide either email or phone, not both.",
      path: ["recipientPhone"],
    });
  }
}

export const transferTicketSchema = z.object(recipientFields).superRefine(refineRecipient);

export const bulkTransferTicketsSchema = z
  .object({
    ticketIds: z
      .array(z.string().uuid("Invalid ticket id."))
      .min(1, "Select at least one ticket.")
      .max(20, "You can transfer up to 20 tickets at once."),
    ...recipientFields,
  })
  .superRefine(refineRecipient);
