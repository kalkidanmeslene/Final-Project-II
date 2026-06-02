import type { NextRequest } from "next/server";
import { handleGetProfile, handleUpdateProfile } from "@/lib/profile/profile.controller";

export async function GET() {
  return handleGetProfile();
}

export async function PATCH(req: NextRequest) {
  return handleUpdateProfile(req);
}
