import type { NextRequest } from "next/server";
import { handleChangePassword } from "@/lib/profile/profile.controller";

export async function POST(req: NextRequest) {
  return handleChangePassword(req);
}
