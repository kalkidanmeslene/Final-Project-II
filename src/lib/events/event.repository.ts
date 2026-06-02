import type { EventStatus, EventVisibility, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const eventInclude = {
  category: true,
  organizer: { select: { id: true, fullName: true } },
  media: { orderBy: { sortOrder: "asc" as const } },
  tickets: { where: { status: "confirmed" }, select: { id: true, status: true } },
  ticketTypes: { select: { soldCount: true, capacity: true } },
} satisfies Prisma.EventInclude;

export async function findCategories() {
  return prisma.eventCategory.findMany({ orderBy: { name: "asc" } });
}

export async function findCategoryById(id: string) {
  return prisma.eventCategory.findUnique({ where: { id } });
}

export async function countTicketsSold(eventId: string) {
  const agg = await prisma.ticketType.aggregate({
    where: { eventId },
    _sum: { soldCount: true },
  });
  return agg._sum.soldCount ?? 0;
}

export async function findEventById(id: string) {
  return prisma.event.findUnique({ where: { id }, include: eventInclude });
}

export async function findEventBySlug(slug: string) {
  return prisma.event.findUnique({ where: { slug }, include: eventInclude });
}

export async function slugExists(slug: string, excludeId?: string) {
  const found = await prisma.event.findFirst({
    where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  return !!found;
}

export async function createEvent(data: Prisma.EventCreateInput) {
  return prisma.event.create({ data, include: eventInclude });
}

export async function updateEvent(id: string, data: Prisma.EventUpdateInput) {
  return prisma.event.update({ where: { id }, data, include: eventInclude });
}

export async function deleteEvent(id: string) {
  return prisma.event.delete({ where: { id } });
}

export async function listPublicEvents(filters?: {
  categorySlug?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.EventWhereInput = {
    status: "approved",
    visibility: "public",
    endsAt: { gte: new Date() },
    ...(filters?.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters?.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { location: { contains: filters.search, mode: "insensitive" } },
            { venue: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: eventInclude,
      orderBy: { startsAt: "asc" },
      take: filters?.limit ?? 24,
      skip: filters?.offset ?? 0,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total };
}

export async function listOrganizerEvents(organizerId: string) {
  return prisma.event.findMany({
    where: { organizerId },
    include: eventInclude,
    orderBy: { startsAt: "desc" },
  });
}

export async function listPendingEvents() {
  return prisma.event.findMany({
    where: { status: "pending" },
    include: eventInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function addEventMedia(eventId: string, url: string, sortOrder: number) {
  return prisma.eventMedia.create({
    data: { eventId, url, mediaType: "image", sortOrder },
  });
}

export async function removeEventMedia(mediaId: string, eventId: string) {
  return prisma.eventMedia.deleteMany({ where: { id: mediaId, eventId } });
}

export async function markEventCompleted(id: string) {
  return prisma.event.update({
    where: { id },
    data: { status: "completed" },
    include: eventInclude,
  });
}

export async function setEventStatus(
  id: string,
  status: EventStatus,
  extra?: { reviewedBy?: string; reviewNote?: string | null; reviewedAt?: Date },
) {
  return prisma.event.update({
    where: { id },
    data: {
      status,
      reviewedAt: extra?.reviewedAt,
      reviewedBy: extra?.reviewedBy,
      reviewNote: extra?.reviewNote,
    },
    include: eventInclude,
  });
}
