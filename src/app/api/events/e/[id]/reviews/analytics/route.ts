import { handleOrganizerReviewAnalytics } from "@/lib/reviews/review.controller";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  return handleOrganizerReviewAnalytics(id);
}
