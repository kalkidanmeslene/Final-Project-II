import type { NextRequest } from "next/server";
import { handleAdminAuditLogs } from "@/lib/admin-dashboard/admin-dashboard.controller";

export async function GET(req: NextRequest) {
  return handleAdminAuditLogs(req);
}
