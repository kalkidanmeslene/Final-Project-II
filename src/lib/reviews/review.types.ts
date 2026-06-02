import type { ReviewStatus } from "@prisma/client";

export type ReviewDto = {
  id: string;
  eventId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  user: { id: string; fullName: string; profilePictureUrl: string | null };
  event?: { id: string; title: string; slug: string };
};

export type EventRatingSummary = {
  averageRating: number | null;
  reviewCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ReviewListResult = {
  reviews: ReviewDto[];
  summary: EventRatingSummary;
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
};

export type ReviewEligibility = {
  canReview: boolean;
  reason?: string;
  existingReviewId?: string;
  ticketId?: string;
};

export type OrganizerReviewAnalytics = {
  summary: EventRatingSummary;
  recentReviews: ReviewDto[];
  pendingCount: number;
};
