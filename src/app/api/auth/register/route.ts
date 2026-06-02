import type { NextRequest } from "next/server";
import { handleRegister } from "@/lib/auth/auth.controller";

export async function POST(req: NextRequest) {
  return handleRegister(req);
}
