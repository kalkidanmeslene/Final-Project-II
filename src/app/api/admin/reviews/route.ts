import type { NextRequest } from "next/server";
import { handleAdminReviewQueue } from "@/lib/reviews/review.controller";

export async function GET(req: NextRequest) {
  return handleAdminReviewQueue(req);
}
