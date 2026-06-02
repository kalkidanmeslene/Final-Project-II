"use client";

import { useOrganizerReviewAnalytics } from "@/hooks/use-reviews";
import { RatingDisplay } from "./star-rating";
import { ReviewList } from "./review-list";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

export function OrganizerReviewsPanel({ eventId }: { eventId: string }) {
  const { data, isLoading } = useOrganizerReviewAnalytics(eventId);

  if (isLoading || !data) {
    return <Spinner label="Loading review analytics" />;
  }

  const { summary, recentReviews, pendingCount } = data;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Reviews & ratings</h3>
        {pendingCount > 0 && <Badge variant="info">{pendingCount} pending moderation</Badge>}
      </div>
      <RatingDisplay averageRating={summary.averageRating} reviewCount={summary.reviewCount} />
      <div className="mt-6">
        <ReviewList reviews={recentReviews} showStatus />
      </div>
      {summary.reviewCount === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Reviews appear after verified attendees check in and submit feedback.
        </p>
      )}
    </div>
  );
}
