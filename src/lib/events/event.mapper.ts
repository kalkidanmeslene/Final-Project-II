import type { Decimal } from "@prisma/client/runtime/library";
import type { Event, EventCategory, EventMedia, User } from "@prisma/client";
import type { EventAvailability, EventDetail, EventListItem } from "./event.types";

type EventWithRelations = Event & {
  category: Pick<EventCategory, "id" | "name" | "slug">;
  organizer: Pick<User, "id" | "fullName">;
  media?: EventMedia[];
  _count?: { tickets: number };
  ticketTypes?: { soldCount: number; capacity?: number }[];
};

function toNumber(price: Decimal | number): number {
  return typeof price === "number" ? price : Number(price.toString());
}

export function countSoldTickets(
  event: EventWithRelations & { tickets?: { id: string; status: string }[] },
) {
  if (event.ticketTypes?.length) {
    return event.ticketTypes.reduce((sum, tt) => sum + tt.soldCount, 0);
  }
  if (event.tickets) {
    return event.tickets.filter((t) => t.status === "confirmed").length;
  }
  return 0;
}

export function toAvailability(capacity: number, sold: number): EventAvailability {
  const available = Math.max(0, capacity - sold);
  return { capacity, sold, available };
}

export function toEventListItem(event: EventWithRelations, sold: number): EventListItem {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    category: { id: event.category.id, name: event.category.name, slug: event.category.slug },
    location: event.location,
    venue: event.venue,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    ticketPrice: toNumber(event.ticketPrice),
    capacity: event.capacity,
    bannerUrl: event.bannerUrl,
    status: event.status,
    visibility: event.visibility,
    transferEnabled: event.transferEnabled,
    isFeatured: event.isFeatured,
    ticketsSold: event.ticketsSold ?? sold,
    availability: toAvailability(event.capacity, sold),
    organizer: { id: event.organizer.id, fullName: event.organizer.fullName },
    averageRating: event.averageRating != null ? Number(event.averageRating) : null,
    reviewCount: event.reviewCount ?? 0,
  };
}

export function toEventDetail(event: EventWithRelations, sold: number): EventDetail {
  return {
    ...toEventListItem(event, sold),
    reviewNote: event.reviewNote,
    postponedAt: event.postponedAt?.toISOString() ?? null,
    postponeReason: event.postponeReason,
    gallery: (event.media ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => ({
        id: m.id,
        url: m.url,
        mediaType: m.mediaType,
        sortOrder: m.sortOrder,
      })),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export async function syncCompletedStatus(event: Event): Promise<Event> {
  if (event.status === "approved" && event.endsAt.getTime() < Date.now()) {
    return { ...event, status: "completed" as const };
  }
  return event;
}
