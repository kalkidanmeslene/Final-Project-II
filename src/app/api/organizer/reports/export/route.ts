import type { NextRequest } from "next/server";
import { handleOrganizerReportsExport } from "@/lib/reports/reports.controller";

export async function GET(req: NextRequest) {
  return handleOrganizerReportsExport(req);
}
