import type { UserRole } from "@prisma/client";
import { buildRatingSummary, statusFilter, toReviewDto } from "./review.mapper";
import {
  countPendingForEvent,
  countUserReviewsSince,
  createReview,
  findEventById,
  findEventBySlug,
  findExistingReview,
  findReviewById,
  findVerifiedTicket,
  getRatingDistribution,
  listOrganizerEventReviews,
  listPendingReviews,
  listReviews,
  moderateReview,
  recalculateEventRating,
} from "./review.repository";
import { detectSpam, MAX_REVIEWS_PER_DAY } from "./spam";
import type { OrganizerReviewAnalytics, ReviewEligibility, ReviewListResult } from "./review.types";

function eventEnded(endsAt: Date) {
  return endsAt.getTime() < Date.now();
}

export async function getReviewEligibility(userId: string, eventSlug: string): Promise<ReviewEligibility> {
  const event = await findEventBySlug(eventSlug);
  if (!event) return { canReview: false, reason: "Event not found." };
  if (!["approved", "completed"].includes(event.status)) {
    return { canReview: false, reason: "This event is not open for reviews." };
  }

  const existing = await findExistingReview(userId, event.id);
  if (existing) {
    return {
      canReview: false,
      reason: "You already reviewed this event.",
      existingReviewId: existing.id,
    };
  }

  const ticket = await findVerifiedTicket(userId, event.id);
  if (!ticket) {
    return {
      canReview: false,
      reason: "Only verified attendees who checked in can leave a review.",
    };
  }

  if (!eventEnded(event.endsAt)) {
    return {
      canReview: false,
      reason: "Reviews open after the event ends.",
      ticketId: ticket.id,
    };
  }

  return { canReview: true, ticketId: ticket.id };
}

export async function submitReview(args: {
  userId: string;
  eventSlug: string;
  rating: number;
  comment: string;
  ticketId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const spam = detectSpam(args.comment);
  if (spam) return { ok: false as const, code: "SPAM_DETECTED" as const, message: spam };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await countUserReviewsSince(args.userId, since);
  if (recentCount >= MAX_REVIEWS_PER_DAY) {
    return {
      ok: false as const,
      code: "RATE_LIMIT" as const,
      message: "You have reached the daily review limit. Try again tomorrow.",
    };
  }

  const eligibility = await getReviewEligibility(args.userId, args.eventSlug);
  if (!eligibility.canReview) {
    return {
      ok: false as const,
      code: "NOT_ELIGIBLE" as const,
      message: eligibility.reason ?? "You cannot review this event.",
    };
  }

  const ticketId = args.ticketId ?? eligibility.ticketId;
  if (!ticketId) {
    return { ok: false as const, code: "NOT_ELIGIBLE" as const, message: "Verified ticket required." };
  }

  const event = await findEventBySlug(args.eventSlug);
  if (!event) return { ok: false as const, code: "NOT_FOUND" as const, message: "Event not found." };

  const ticket = await findVerifiedTicket(args.userId, event.id, ticketId);
  if (!ticket) {
    return { ok: false as const, code: "NOT_ELIGIBLE" as const, message: "Invalid or unverified ticket." };
  }

  const review = await createReview({
    rating: args.rating,
    comment: args.comment.trim(),
    status: "pending",
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    user: { connect: { id: args.userId } },
    event: { connect: { id: event.id } },
    ticket: { connect: { id: ticket.id } },
  });

  return { ok: true as const, review: toReviewDto(review) };
}

export async function getPublicEventReviews(
  eventSlug: string,
  limit: number,
  offset: number,
): Promise<ReviewListResult | null> {
  const event = await findEventBySlug(eventSlug);
  if (!event) return null;

  const { reviews, total } = await listReviews({
    eventId: event.id,
    status: "approved",
    limit,
    offset,
  });

  const distribution = await getRatingDistribution(event.id);
  const summary = buildRatingSummary(
    event.averageRating != null ? Number(event.averageRating) : null,
    event.reviewCount,
    distribution,
  );

  const nextOffset = offset + reviews.length;
  return {
    reviews: reviews.map(toReviewDto),
    summary,
    total,
    limit,
    offset,
    hasMore: nextOffset < total,
    nextOffset: nextOffset < total ? nextOffset : null,
  };
}

export async function getOrganizerReviewAnalytics(args: {
  eventId: string;
  userId: string;
  role: UserRole;
}): Promise<{ ok: true; analytics: OrganizerReviewAnalytics } | { ok: false; code: string }> {
  const eventRow = await findEventById(args.eventId);
  if (!eventRow) return { ok: false, code: "NOT_FOUND" };
  if (args.role !== "admin" && eventRow.organizerId !== args.userId) {
    return { ok: false, code: "FORBIDDEN" };
  }

  const distribution = await getRatingDistribution(eventRow.id);
  const summary = buildRatingSummary(
    eventRow.averageRating != null ? Number(eventRow.averageRating) : null,
    eventRow.reviewCount,
    distribution,
  );
  const recentReviews = (await listOrganizerEventReviews(eventRow.id)).map(toReviewDto);
  const pendingCount = await countPendingForEvent(eventRow.id);

  return {
    ok: true,
    analytics: { summary, recentReviews, pendingCount },
  };
}

export async function adminModerateReview(args: {
  reviewId: string;
  adminId: string;
  status: "approved" | "rejected" | "flagged";
  note?: string;
}) {
  const existing = await findReviewById(args.reviewId);
  if (!existing) return { ok: false as const, code: "NOT_FOUND" as const };

  const updated = await moderateReview({
    id: args.reviewId,
    status: args.status,
    moderatedById: args.adminId,
    note: args.note,
  });

  await recalculateEventRating(existing.eventId);

  return { ok: true as const, review: toReviewDto(updated) };
}

export async function getAdminReviewQueue(limit: number, offset: number) {
  const { reviews, total } = await listPendingReviews(limit, offset);
  const nextOffset = offset + reviews.length;
  return {
    reviews: reviews.map(toReviewDto),
    total,
    limit,
    offset,
    hasMore: nextOffset < total,
    nextOffset: nextOffset < total ? nextOffset : null,
  };
}

export async function getEventReviewsForOrganizer(args: {
  eventId: string;
  userId: string;
  role: UserRole;
  limit: number;
  offset: number;
  status?: string;
}) {
  const eventRow = await findEventById(args.eventId);

  if (!eventRow) return { ok: false as const, code: "NOT_FOUND" as const };
  if (args.role !== "admin" && eventRow.organizerId !== args.userId) {
    return { ok: false as const, code: "FORBIDDEN" as const };
  }

  const filter = statusFilter(args.status ?? "approved");
  const { reviews, total } = await listReviews({
    eventId: eventRow.id,
    status: filter,
    limit: args.limit,
    offset: args.offset,
  });

  const distribution = await getRatingDistribution(eventRow.id);
  const summary = buildRatingSummary(
    eventRow.averageRating != null ? Number(eventRow.averageRating) : null,
    eventRow.reviewCount,
    distribution,
  );

  const nextOffset = args.offset + reviews.length;
  return {
    ok: true as const,
    result: {
      reviews: reviews.map(toReviewDto),
      summary,
      total,
      limit: args.limit,
      offset: args.offset,
      hasMore: nextOffset < total,
      nextOffset: nextOffset < total ? nextOffset : null,
    },
  };
}
