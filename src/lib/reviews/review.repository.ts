import type { Prisma, ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const reviewInclude = {
  user: { select: { id: true, fullName: true, profilePictureUrl: true } },
  event: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.EventReviewInclude;

export async function findEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      organizerId: true,
      status: true,
      endsAt: true,
      averageRating: true,
      reviewCount: true,
    },
  });
}

export async function findEventBySlug(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      organizerId: true,
      status: true,
      endsAt: true,
      averageRating: true,
      reviewCount: true,
    },
  });
}

export async function findVerifiedTicket(userId: string, eventId: string, ticketId?: string) {
  return prisma.ticket.findFirst({
    where: {
      userId,
      eventId,
      status: "confirmed",
      checkedInAt: { not: null },
      ...(ticketId ? { id: ticketId } : {}),
    },
    orderBy: { checkedInAt: "desc" },
  });
}

export async function findExistingReview(userId: string, eventId: string) {
  return prisma.eventReview.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
}

export async function countUserReviewsSince(userId: string, since: Date) {
  return prisma.eventReview.count({
    where: { userId, createdAt: { gte: since } },
  });
}

export async function createReview(data: Prisma.EventReviewCreateInput) {
  return prisma.eventReview.create({ data, include: reviewInclude });
}

export async function listReviews(args: {
  eventId: string;
  status?: ReviewStatus;
  limit: number;
  offset: number;
}) {
  const where: Prisma.EventReviewWhereInput = {
    eventId: args.eventId,
    ...(args.status ? { status: args.status } : {}),
  };

  const [reviews, total] = await Promise.all([
    prisma.eventReview.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
      take: args.limit,
      skip: args.offset,
    }),
    prisma.eventReview.count({ where }),
  ]);

  return { reviews, total };
}

export async function getRatingDistribution(eventId: string) {
  const rows = await prisma.eventReview.groupBy({
    by: ["rating"],
    where: { eventId, status: "approved" },
    _count: { rating: true },
  });
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) {
    distribution[row.rating] = row._count.rating;
  }
  return distribution;
}

export async function recalculateEventRating(eventId: string) {
  const agg = await prisma.eventReview.aggregate({
    where: { eventId, status: "approved" },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const averageRating = agg._avg.rating ?? null;
  const reviewCount = agg._count.rating;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      averageRating: averageRating != null ? averageRating : null,
      reviewCount,
    },
  });

  return { averageRating, reviewCount };
}

export async function findReviewById(id: string) {
  return prisma.eventReview.findUnique({
    where: { id },
    include: { ...reviewInclude, event: { select: { id: true, title: true, slug: true, organizerId: true } } },
  });
}

export async function moderateReview(args: {
  id: string;
  status: ReviewStatus;
  moderatedById: string;
  note?: string;
}) {
  return prisma.eventReview.update({
    where: { id: args.id },
    data: {
      status: args.status,
      moderatedById: args.moderatedById,
      moderatedAt: new Date(),
      moderationNote: args.note ?? null,
    },
    include: reviewInclude,
  });
}

export async function listPendingReviews(limit: number, offset: number) {
  const where = { status: "pending" as const };
  const [reviews, total] = await Promise.all([
    prisma.eventReview.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset,
    }),
    prisma.eventReview.count({ where }),
  ]);
  return { reviews, total };
}

export async function countPendingForEvent(eventId: string) {
  return prisma.eventReview.count({ where: { eventId, status: "pending" } });
}

export async function listOrganizerEventReviews(eventId: string, limit = 10) {
  return prisma.eventReview.findMany({
    where: { eventId, status: { in: ["approved", "pending"] } },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
