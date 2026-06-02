"use client";

import { useAuth } from "@/hooks/use-auth";
import { useInfiniteEventReviews } from "@/hooks/use-reviews";
import type { EventRatingSummary } from "@/lib/reviews/review.types";
import { RatingDisplay } from "./star-rating";
import { ReviewForm } from "./review-form";
import { ReviewList } from "./review-list";

export function EventReviewsSection({
  eventSlug,
  eventTitle,
  summary: initialSummary,
}: {
  eventSlug: string;
  eventTitle: string;
  summary?: EventRatingSummary;
}) {
  const { user } = useAuth();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteEventReviews(eventSlug);

  const reviews = data?.pages.flatMap((p) => p.reviews) ?? [];
  const summary = data?.pages[0]?.summary ?? initialSummary;

  return (
    <section className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold">Reviews</h2>
        {summary && (
          <RatingDisplay averageRating={summary.averageRating} reviewCount={summary.reviewCount} />
        )}
      </div>

      {user && <ReviewForm eventSlug={eventSlug} eventTitle={eventTitle} />}

      <ReviewList
        reviews={reviews}
        isLoading={isLoading}
        hasMore={!!hasNextPage}
        isFetchingMore={isFetchingNextPage}
        onLoadMore={() => void fetchNextPage()}
      />
    </section>
  );
}
