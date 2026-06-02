"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type {
  OrganizerReviewAnalytics,
  ReviewEligibility,
  ReviewListResult,
} from "@/lib/reviews/review.types";

export const reviewKeys = {
  all: ["reviews"] as const,
  event: (slug: string) => ["reviews", "event", slug] as const,
  eligibility: (slug: string) => ["reviews", "eligibility", slug] as const,
  organizer: (eventId: string) => ["reviews", "organizer", eventId] as const,
  admin: ["reviews", "admin"] as const,
};

export function useInfiniteEventReviews(slug: string) {
  return useInfiniteQuery({
    queryKey: reviewKeys.event(slug),
    queryFn: ({ pageParam }) =>
      fetchJson<ReviewListResult>(`/api/events/s/${slug}/reviews?limit=10&offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    enabled: !!slug,
  });
}

export function useReviewEligibility(slug: string) {
  return useQuery({
    queryKey: reviewKeys.eligibility(slug),
    queryFn: () => fetchJson<{ eligibility: ReviewEligibility }>(`/api/events/s/${slug}/reviews/eligibility`),
    enabled: !!slug,
  });
}

export function useOrganizerReviewAnalytics(eventId: string) {
  return useQuery({
    queryKey: reviewKeys.organizer(eventId),
    queryFn: () => fetchJson<OrganizerReviewAnalytics>(`/api/events/e/${eventId}/reviews/analytics`),
    enabled: !!eventId,
  });
}

export function useAdminReviews() {
  return useQuery({
    queryKey: reviewKeys.admin,
    queryFn: () =>
      fetchJson<{
        reviews: ReviewListResult["reviews"];
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      }>("/api/admin/reviews?limit=20&status=pending"),
    refetchInterval: 30_000,
  });
}

export function useReviewMutations(eventSlug?: string) {
  const qc = useQueryClient();

  const submitReview = useMutation({
    mutationFn: (body: { rating: number; comment: string; ticketId?: string }) =>
      fetchJson(`/api/events/s/${eventSlug}/reviews`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      if (eventSlug) {
        void qc.invalidateQueries({ queryKey: reviewKeys.event(eventSlug) });
        void qc.invalidateQueries({ queryKey: reviewKeys.eligibility(eventSlug) });
      }
    },
  });

  const moderateReview = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: "approved" | "rejected" | "flagged"; note?: string }) =>
      fetchJson(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, note }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reviewKeys.admin });
      void qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });

  return { submitReview, moderateReview };
}
