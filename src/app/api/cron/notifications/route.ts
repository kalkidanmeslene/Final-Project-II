import type { NextRequest } from "next/server";
import { handleProcessScheduledNotifications } from "@/lib/notifications/notification.controller";

export async function POST(req: NextRequest) {
  return handleProcessScheduledNotifications(req);
}
