import type { NextRequest } from "next/server";
import { handleAdminReportsExport } from "@/lib/reports/reports.controller";

export async function GET(req: NextRequest) {
  return handleAdminReportsExport(req);
}
