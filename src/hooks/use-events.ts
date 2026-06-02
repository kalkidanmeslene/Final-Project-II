"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type { EventDetail, EventListItem } from "@/lib/events/event.types";
import type { DiscoverHomePayload, EventSearchResult, EventSortOption } from "@/lib/discovery/discovery.types";

export type PublicEventFilters = {
  q?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  priceMin?: string;
  priceMax?: string;
  free?: boolean;
  sort?: EventSortOption;
};

function buildSearchParams(filters: PublicEventFilters, offset: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.priceMin) params.set("priceMin", filters.priceMin);
  if (filters.priceMax) params.set("priceMax", filters.priceMax);
  if (filters.free) params.set("free", "true");
  if (filters.sort) params.set("sort", filters.sort);
  params.set("limit", "12");
  params.set("offset", String(offset));
  return params.toString();
}

export const eventsKeys = {
  all: ["events"] as const,
  list: (filters?: PublicEventFilters) => ["events", "list", filters] as const,
  discover: ["events", "discover"] as const,
  featured: ["events", "featured"] as const,
  trending: ["events", "trending"] as const,
  detail: (slug: string) => ["events", "detail", slug] as const,
  byId: (id: string) => ["events", "by-id", id] as const,
  availability: (slug: string) => ["events", "availability", slug] as const,
  organizer: ["events", "organizer"] as const,
  categories: ["events", "categories"] as const,
  adminPending: ["events", "admin", "pending"] as const,
};

export function useEventCategories() {
  return useQuery({
    queryKey: eventsKeys.categories,
    queryFn: () => fetchJson<{ categories: { id: string; name: string; slug: string }[] }>("/api/events/categories"),
  });
}

export function usePublicEvents(filters?: PublicEventFilters) {
  const qs = buildSearchParams(filters ?? {}, 0);

  return useQuery({
    queryKey: eventsKeys.list(filters),
    queryFn: () => fetchJson<EventSearchResult>(`/api/events?${qs}`),
  });
}

export function useInfinitePublicEvents(filters: PublicEventFilters) {
  return useInfiniteQuery({
    queryKey: eventsKeys.list(filters),
    queryFn: ({ pageParam }) =>
      fetchJson<EventSearchResult>(`/api/events?${buildSearchParams(filters, pageParam)}`),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
  });
}

export function useDiscoverHome() {
  return useQuery({
    queryKey: eventsKeys.discover,
    queryFn: () => fetchJson<DiscoverHomePayload>("/api/events/discover"),
    staleTime: 60_000,
  });
}

export function useFeaturedEvents(limit = 6) {
  return useQuery({
    queryKey: [...eventsKeys.featured, limit],
    queryFn: () => fetchJson<{ events: EventListItem[] }>(`/api/events/featured?limit=${limit}`),
    staleTime: 60_000,
  });
}

export function useTrendingEvents(limit = 8) {
  return useQuery({
    queryKey: [...eventsKeys.trending, limit],
    queryFn: () => fetchJson<{ events: EventListItem[] }>(`/api/events/trending?limit=${limit}`),
    staleTime: 60_000,
  });
}

export function useEvent(slug: string) {
  return useQuery({
    queryKey: eventsKeys.detail(slug),
    queryFn: () => fetchJson<{ event: EventDetail }>(`/api/events/s/${slug}`),
    enabled: !!slug,
  });
}

export function useEventAvailability(slug: string, enabled = true) {
  return useQuery({
    queryKey: eventsKeys.availability(slug),
    queryFn: () =>
      fetchJson<{
        availability: {
          capacity: number;
          sold: number;
          available: number;
          updatedAt: string;
        };
      }>(`/api/events/s/${slug}/availability`),
    enabled: !!slug && enabled,
    refetchInterval: 5000,
  });
}

export function useOrganizerEvents() {
  return useQuery({
    queryKey: eventsKeys.organizer,
    queryFn: () => fetchJson<{ events: EventListItem[] }>("/api/events/organizer"),
  });
}

export function useAdminPendingEvents() {
  return useQuery({
    queryKey: eventsKeys.adminPending,
    queryFn: () => fetchJson<{ events: EventListItem[] }>("/api/admin/events/pending"),
  });
}

export function useEventMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: eventsKeys.all });
  };

  const syncEventDetailCache = (updated: EventDetail) => {
    qc.setQueryData(eventsKeys.byId(updated.id), updated);
    qc.setQueryData(eventsKeys.detail(updated.slug), { event: updated });
  };

  const createEvent = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchJson<{ event: EventDetail }>("/api/events", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (data) => {
      syncEventDetailCache(data.event);
      invalidate();
    },
  });

  const updateEvent = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      fetchJson<{ event: EventDetail }>(`/api/events/e/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: eventsKeys.organizer });
      const prev = qc.getQueryData<{ events: EventListItem[] }>(eventsKeys.organizer);
      if (prev) {
        qc.setQueryData(eventsKeys.organizer, {
          events: prev.events.map((e) =>
            e.id === id
              ? {
                  ...e,
                  title: (body.title as string) ?? e.title,
                  location: (body.location as string) ?? e.location,
                  venue: (body.venue as string) ?? e.venue,
                }
              : e,
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(eventsKeys.organizer, ctx.prev);
    },
    onSuccess: (data) => {
      syncEventDetailCache(data.event);
      invalidate();
    },
  });

  const deleteEvent = useMutation({
    mutationFn: (id: string) => fetchJson(`/api/events/e/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  const postponeEvent = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      fetchJson<{ event: EventDetail }>(`/api/events/e/${id}/postpone`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: invalidate,
  });

  const submitEvent = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ event: EventDetail }>(`/api/events/e/${id}/submit`, { method: "POST", body: "{}" }),
    onSuccess: (data) => {
      syncEventDetailCache(data.event);
      invalidate();
    },
  });

  const cancelEvent = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      fetchJson<{ event: EventDetail }>(`/api/events/e/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: invalidate,
  });

  const uploadBanner = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append("banner", file);
      return fetchJson<{ event: EventDetail }>(`/api/events/e/${id}/banner`, { method: "POST", body: fd });
    },
    onSuccess: (data) => {
      syncEventDetailCache(data.event);
      invalidate();
    },
  });

  const uploadGallery = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append("media", file);
      return fetchJson<{ event: EventDetail }>(`/api/events/e/${id}/gallery`, { method: "POST", body: fd });
    },
    onSuccess: (data) => {
      syncEventDetailCache(data.event);
      invalidate();
    },
  });

  const approveEvent = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      fetchJson<{ event: EventDetail }>(`/api/admin/events/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    onSuccess: invalidate,
  });

  const rejectEvent = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      fetchJson<{ event: EventDetail }>(`/api/admin/events/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    onSuccess: invalidate,
  });

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    postponeEvent,
    submitEvent,
    cancelEvent,
    uploadBanner,
    uploadGallery,
    approveEvent,
    rejectEvent,
  };
}
