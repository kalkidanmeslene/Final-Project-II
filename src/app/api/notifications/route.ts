import type { NextRequest } from "next/server";
import { handleListNotifications } from "@/lib/notifications/notification.controller";

export async function GET(req: NextRequest) {
  return handleListNotifications(req);
}
