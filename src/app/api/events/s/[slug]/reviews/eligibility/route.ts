import { handleGetReviewEligibilityPublic } from "@/lib/reviews/review.controller";

type Props = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params;
  return handleGetReviewEligibilityPublic(slug);
}
