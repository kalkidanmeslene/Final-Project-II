import type { NextRequest } from "next/server";
import {
  handleGetPublicReviews,
  handleGetReviewEligibilityPublic,
  handleSubmitReview,
} from "@/lib/reviews/review.controller";

type Props = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  const { slug } = await params;
  return handleGetPublicReviews(req, slug);
}

export async function POST(req: NextRequest, { params }: Props) {
  const { slug } = await params;
  return handleSubmitReview(req, slug);
}
