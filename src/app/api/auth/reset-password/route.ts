import type { NextRequest } from "next/server";
import { handleResetPassword } from "@/lib/auth/auth.controller";

export async function POST(req: NextRequest) {
  return handleResetPassword(req);
}
