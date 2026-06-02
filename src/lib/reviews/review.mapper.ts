import type { EventReview, ReviewStatus, User } from "@prisma/client";
import type { EventRatingSummary, ReviewDto } from "./review.types";

type ReviewRow = EventReview & {
  user: Pick<User, "id" | "fullName" | "profilePictureUrl">;
  event?: { id: string; title: string; slug: string };
};

export function toReviewDto(row: ReviewRow): ReviewDto {
  return {
    id: row.id,
    eventId: row.eventId,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    user: {
      id: row.user.id,
      fullName: row.user.fullName,
      profilePictureUrl: row.user.profilePictureUrl,
    },
    event: row.event,
  };
}

export function buildRatingSummary(
  averageRating: number | null | undefined,
  reviewCount: number,
  distribution?: Record<number, number>,
): EventRatingSummary {
  const dist = distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  return {
    averageRating: averageRating != null ? Math.round(averageRating * 10) / 10 : null,
    reviewCount,
    distribution: {
      1: dist[1] ?? 0,
      2: dist[2] ?? 0,
      3: dist[3] ?? 0,
      4: dist[4] ?? 0,
      5: dist[5] ?? 0,
    },
  };
}

export function statusFilter(status: string): ReviewStatus | undefined {
  if (status === "all") return undefined;
  return status as ReviewStatus;
}
