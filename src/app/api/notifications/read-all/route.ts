import { handleMarkAllRead } from "@/lib/notifications/notification.controller";

export async function POST() {
  return handleMarkAllRead();
}
