import type { NextRequest } from "next/server";
import { handleOrganizerRequest } from "@/lib/auth/auth.controller";

export async function POST(req: NextRequest) {
  return handleOrganizerRequest(req);
}
