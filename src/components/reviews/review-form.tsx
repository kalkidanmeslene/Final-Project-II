"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api/fetch-json";
import { useReviewEligibility, useReviewMutations } from "@/hooks/use-reviews";
import { StarRating } from "./star-rating";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FormSection } from "@/components/forms/form-section";

export function ReviewForm({ eventSlug, eventTitle }: { eventSlug: string; eventTitle: string }) {
  const { data, isLoading } = useReviewEligibility(eventSlug);
  const { submitReview } = useReviewMutations(eventSlug);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const eligibility = data?.eligibility;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Checking review eligibility...</p>;
  }

  if (!eligibility?.canReview) {
    return (
      <Alert>
        {eligibility?.reason ?? "Sign in and attend this event to leave a review."}
      </Alert>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submitReview.mutateAsync({
        rating,
        comment,
        ticketId: eligibility?.ticketId,
      });
      toast.success("Review submitted for moderation.");
      setComment("");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not submit review.");
    }
  }

  return (
    <FormSection title="Leave a review" description={`Share your experience at "${eventTitle}".`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">Your rating</p>
          <StarRating value={rating} onChange={setRating} />
        </div>
        <div>
          <label htmlFor="review-comment" className="mb-2 block text-sm font-medium">
            Comment
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            minLength={10}
            maxLength={1000}
            required
            placeholder="What did you enjoy? What could be improved?"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">{comment.length}/1000 · min 10 characters</p>
        </div>
        <Button type="submit" variant="primary" disabled={submitReview.isPending}>
          {submitReview.isPending ? "Submitting..." : "Submit review"}
        </Button>
        <p className="text-xs text-muted-foreground">Reviews are moderated before they appear publicly.</p>
      </form>
    </FormSection>
  );
}
