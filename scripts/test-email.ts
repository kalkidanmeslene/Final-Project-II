/**
 * Verify email can reach any attendee address (not just the Resend account owner).
 * Usage: SMTP_PASS=xxxx tsx scripts/test-email.ts attendee@example.com
 */
import "dotenv/config";
import { canDeliverToAnyRecipient } from "../src/lib/notifications/email-delivery";
import { sendNotificationEmail } from "../src/lib/notifications/email.service";

async function main() {
  const to = process.argv[2] ?? "attendee@test.com";
  console.log("canDeliverToAnyRecipient:", canDeliverToAnyRecipient());

  const result = await sendNotificationEmail({
    to,
    type: "booking_confirmed",
    context: {
      userName: "Test Attendee",
      title: "Tickets confirmed",
      body: "This is a delivery test from Hibir Events.",
      eventTitle: "Sample Event",
      ticketsUrl: process.env.APP_BASE_URL + "/dashboard/attendee/tickets",
    },
  });

  console.log("result:", result);
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
