import type { NextRequest } from "next/server";
import { handleForgotPassword } from "@/lib/auth/auth.controller";

export async function POST(req: NextRequest) {
  return handleForgotPassword(req);
}
