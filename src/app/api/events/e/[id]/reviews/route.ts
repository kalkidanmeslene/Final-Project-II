import type { NextRequest } from "next/server";
import { handleOrganizerReviews } from "@/lib/reviews/review.controller";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  const { id } = await params;
  return handleOrganizerReviews(req, id);
}
