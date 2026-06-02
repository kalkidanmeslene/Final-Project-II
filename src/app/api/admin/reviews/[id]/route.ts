import type { NextRequest } from "next/server";
import { handleAdminModerateReview } from "@/lib/reviews/review.controller";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  return handleAdminModerateReview(req, id);
}
