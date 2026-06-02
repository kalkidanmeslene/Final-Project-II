"use client";

import type { ReviewDto } from "@/lib/reviews/review.types";
import { formatDate } from "@/lib/format";
import { StarRating } from "./star-rating";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  reviews: ReviewDto[];
  hasMore?: boolean;
  isLoading?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  showStatus?: boolean;
};

export function ReviewList({
  reviews,
  hasMore,
  isLoading,
  isFetchingMore,
  onLoadMore,
  showStatus,
}: Props) {
  if (isLoading) return <Spinner label="Loading reviews" />;

  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">
        No reviews yet. Be the first to share your experience!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{review.user.fullName}</p>
              <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StarRating value={review.rating} readOnly size="sm" />
              {showStatus && review.status !== "approved" && (
                <span className="text-xs capitalize text-muted-foreground">{review.status}</span>
              )}
            </div>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{review.comment}</p>
        </article>
      ))}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" type="button" disabled={isFetchingMore} onClick={onLoadMore}>
            {isFetchingMore ? "Loading..." : "Load more reviews"}
          </Button>
        </div>
      )}
    </div>
  );
}
