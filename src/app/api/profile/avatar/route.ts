import type { NextRequest } from "next/server";
import { handleUploadAvatar } from "@/lib/profile/profile.controller";

export async function POST(req: NextRequest) {
  return handleUploadAvatar(req);
}
