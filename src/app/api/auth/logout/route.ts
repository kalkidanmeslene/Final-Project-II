import type { NextRequest } from "next/server";
import { handleLogout } from "@/lib/auth/auth.controller";

export async function POST(req: NextRequest) {
  return handleLogout(req);
}
