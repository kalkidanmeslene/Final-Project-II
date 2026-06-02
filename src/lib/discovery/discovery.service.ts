import { countSoldTickets, toEventListItem } from "@/lib/events/event.mapper";
import { findCategories } from "@/lib/events/event.repository";
import type { DiscoverHomePayload, EventSearchFilters, EventSearchResult } from "./discovery.types";
import { listFeaturedEvents, listTrendingEvents, searchPublicEvents } from "./discovery.repository";

type EventRow = Awaited<ReturnType<typeof searchPublicEvents>>["events"][number];

function mapEvents(events: EventRow[]) {
  return events.map((e) => toEventListItem(e, countSoldTickets(e)));
}

export async function searchEvents(filters: EventSearchFilters): Promise<EventSearchResult> {
  const { events, total, limit, offset } = await searchPublicEvents(filters);
  const nextOffset = offset + events.length;
  return {
    events: mapEvents(events),
    total,
    limit,
    offset,
    hasMore: nextOffset < total,
    nextOffset: nextOffset < total ? nextOffset : null,
  };
}

export async function getFeaturedEvents(limit = 6) {
  const events = await listFeaturedEvents(limit);
  return mapEvents(events);
}

export async function getTrendingEvents(limit = 8) {
  const events = await listTrendingEvents(limit);
  return mapEvents(events);
}

export async function getDiscoverHome(): Promise<DiscoverHomePayload> {
  const [featured, trending, categories] = await Promise.all([
    getFeaturedEvents(6),
    getTrendingEvents(8),
    findCategories(),
  ]);

  return {
    featured,
    trending,
    categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
  };
}
