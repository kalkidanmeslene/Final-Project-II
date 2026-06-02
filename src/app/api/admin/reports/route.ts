import type { NextRequest } from "next/server";
import { handleAdminReports } from "@/lib/reports/reports.controller";

export async function GET(req: NextRequest) {
  return handleAdminReports(req);
}
