import type { EventListItem } from "@/lib/events/event.types";

export type EventSortOption = "date" | "price_asc" | "price_desc" | "popularity";

export type EventSearchFilters = {
  q?: string;
  categorySlug?: string;
  dateFrom?: Date;
  dateTo?: Date;
  priceMin?: number;
  priceMax?: number;
  freeOnly?: boolean;
  sort?: EventSortOption;
  limit?: number;
  offset?: number;
};

export type EventSearchResult = {
  events: EventListItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
};

export type DiscoverHomePayload = {
  featured: EventListItem[];
  trending: EventListItem[];
  categories: { id: string; name: string; slug: string }[];
};
