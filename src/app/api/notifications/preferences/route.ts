import type { NextRequest } from "next/server";
import { handleUpdatePreferences, handleGetPreferences } from "@/lib/notifications/notification.controller";

export async function GET() {
  return handleGetPreferences();
}

export async function PATCH(req: NextRequest) {
  return handleUpdatePreferences(req);
}
