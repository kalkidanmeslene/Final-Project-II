import type { NextRequest } from "next/server";
import { handleOrganizerReports } from "@/lib/reports/reports.controller";

export async function GET(req: NextRequest) {
  return handleOrganizerReports(req);
}
