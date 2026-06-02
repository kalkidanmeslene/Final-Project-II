/**
 * Local/dev helper to process due scheduled reminders.
 * Usage: npm run cron:notifications
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const { processDueScheduledNotifications } = await import(
    "../src/lib/notifications/notification.service"
  );
  const result = await processDueScheduledNotifications();
  console.log("Processed scheduled notifications:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/db");
    await prisma.$disconnect();
  });
