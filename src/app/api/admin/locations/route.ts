import type { NextRequest } from "next/server";
import { handleAdminCreateLocation, handleAdminLocations } from "@/lib/admin-dashboard/admin-dashboard.controller";

export async function GET() {
  return handleAdminLocations();
}

export async function POST(req: NextRequest) {
  return handleAdminCreateLocation(req);
}
