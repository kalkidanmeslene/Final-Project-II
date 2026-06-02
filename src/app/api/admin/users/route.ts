import type { NextRequest } from "next/server";
import { handleAdminUsers } from "@/lib/admin-dashboard/admin-dashboard.controller";

export async function GET(req: NextRequest) {
  return handleAdminUsers(req);
}
