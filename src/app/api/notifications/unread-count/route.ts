import { handleUnreadCount } from "@/lib/notifications/notification.controller";

export async function GET() {
  return handleUnreadCount();
}
