import type { NextRequest } from "next/server";
import { handleAdminCategories, handleAdminCreateCategory } from "@/lib/admin-dashboard/admin-dashboard.controller";

export async function GET() {
  return handleAdminCategories();
}

export async function POST(req: NextRequest) {
  return handleAdminCreateCategory(req);
}
