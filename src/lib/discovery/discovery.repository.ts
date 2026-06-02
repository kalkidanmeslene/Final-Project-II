import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { EventSearchFilters, EventSortOption } from "./discovery.types";

/** Lean include for list/discovery — avoids loading all tickets */
export const discoveryEventInclude = {
  category: { select: { id: true, name: true, slug: true } },
  organizer: { select: { id: true, fullName: true } },
  ticketTypes: { select: { soldCount: true, capacity: true } },
} satisfies Prisma.EventInclude;

function buildPublicWhere(filters: EventSearchFilters): Prisma.EventWhereInput {
  const now = new Date();
  const where: Prisma.EventWhereInput = {
    status: "approved",
    visibility: "public",
    endsAt: { gte: now },
  };

  if (filters.categorySlug) {
    where.category = { slug: filters.categorySlug };
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { venue: { contains: q, mode: "insensitive" } },
      { organizer: { fullName: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    where.startsAt = {
      ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { lte: filters.dateTo } : {}),
    };
  }

  if (filters.freeOnly) {
    where.ticketPrice = 0;
  } else {
    const price: Prisma.DecimalFilter = {};
    if (filters.priceMin !== undefined) price.gte = filters.priceMin;
    if (filters.priceMax !== undefined) price.lte = filters.priceMax;
    if (Object.keys(price).length > 0) where.ticketPrice = price;
  }

  return where;
}

function buildOrderBy(sort: EventSortOption): Prisma.EventOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ ticketPrice: "asc" }, { startsAt: "asc" }];
    case "price_desc":
      return [{ ticketPrice: "desc" }, { startsAt: "asc" }];
    case "popularity":
      return [{ ticketsSold: "desc" }, { startsAt: "asc" }];
    case "date":
    default:
      return [{ startsAt: "asc" }];
  }
}

export async function searchPublicEvents(filters: EventSearchFilters) {
  const where = buildPublicWhere(filters);
  const limit = filters.limit ?? 12;
  const offset = filters.offset ?? 0;
  const sort = filters.sort ?? "date";

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: discoveryEventInclude,
      orderBy: buildOrderBy(sort),
      take: limit,
      skip: offset,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total, limit, offset };
}

export async function listFeaturedEvents(limit = 6) {
  const now = new Date();
  return prisma.event.findMany({
    where: {
      status: "approved",
      visibility: "public",
      endsAt: { gte: now },
      isFeatured: true,
    },
    include: discoveryEventInclude,
    orderBy: [{ startsAt: "asc" }],
    take: limit,
  });
}

export async function listTrendingEvents(limit = 8) {
  const now = new Date();
  return prisma.event.findMany({
    where: {
      status: "approved",
      visibility: "public",
      endsAt: { gte: now },
    },
    include: discoveryEventInclude,
    orderBy: [{ ticketsSold: "desc" }, { startsAt: "asc" }],
    take: limit,
  });
}

export async function syncEventTicketsSold(eventId: string) {
  const agg = await prisma.ticketType.aggregate({
    where: { eventId },
    _sum: { soldCount: true },
  });
  const ticketsSold = agg._sum.soldCount ?? 0;
  await prisma.event.update({
    where: { id: eventId },
    data: { ticketsSold },
  });
  return ticketsSold;
}
