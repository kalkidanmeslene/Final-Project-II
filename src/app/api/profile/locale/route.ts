import type { NextRequest } from "next/server";
import { handlePatchPreferredLanguage } from "@/lib/profile/profile.controller";

export async function PATCH(req: NextRequest) {
  return handlePatchPreferredLanguage(req);
}
