"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api/fetch-json";
import { useAdminReviews, useReviewMutations } from "@/hooks/use-reviews";
import { ReviewList } from "@/components/reviews/review-list";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormSection } from "@/components/forms/form-section";

export function ReviewModerationPanel() {
  const { data, isLoading, refetch } = useAdminReviews();
  const { moderateReview } = useReviewMutations();
  const [note, setNote] = useState("");

  const reviews = data?.reviews ?? [];

  async function moderate(id: string, status: "approved" | "rejected" | "flagged") {
    try {
      await moderateReview.mutateAsync({ id, status, note: note || undefined });
      toast.success(`Review ${status}.`);
      setNote("");
      void refetch();
    } catch (e) {
      toast.error(e instanceof ApiClientError ? e.message : "Moderation failed.");
    }
  }

  return (
    <FormSection
      title="Review moderation"
      description="Approve or reject attendee feedback before it affects public ratings."
    >
      {isLoading ? (
        <Spinner label="Loading pending reviews" />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews awaiting moderation.</p>
      ) : (
        <div className="space-y-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional moderation note..."
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          {reviews.map((review) => (
            <div key={review.id} className="space-y-3 rounded-xl border border-border p-4">
              <ReviewList reviews={[review]} showStatus />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="primary" disabled={moderateReview.isPending} onClick={() => void moderate(review.id, "approved")}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" disabled={moderateReview.isPending} onClick={() => void moderate(review.id, "rejected")}>
                  Reject
                </Button>
                <Button size="sm" variant="outline" disabled={moderateReview.isPending} onClick={() => void moderate(review.id, "flagged")}>
                  Flag
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </FormSection>
  );
}
