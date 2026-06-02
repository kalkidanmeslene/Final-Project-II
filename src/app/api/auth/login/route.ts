import type { NextRequest } from "next/server";
import { handleLogin } from "@/lib/auth/auth.controller";

export async function POST(req: NextRequest) {
  return handleLogin(req);
}
