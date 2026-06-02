import type { NextRequest } from "next/server";
import { handleAdminSettings, handleAdminUpdateSettings } from "@/lib/admin-dashboard/admin-dashboard.controller";

export async function GET() {
  return handleAdminSettings();
}

export async function PATCH(req: NextRequest) {
  return handleAdminUpdateSettings(req);
}
