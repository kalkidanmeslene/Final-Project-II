"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventSearchBar } from "@/components/discovery/event-search-bar";
import { EventFiltersPanel, type EventFilterState } from "@/components/discovery/event-filters-panel";
import { EventInfiniteList } from "@/components/discovery/event-infinite-list";
import { Spinner } from "@/components/ui/spinner";
import { useEventCategories, useInfinitePublicEvents, type PublicEventFilters } from "@/hooks/use-events";
import type { EventSortOption } from "@/lib/discovery/discovery.types";

const DEFAULT_FILTERS: EventFilterState = {
  category: "all",
  priceFilter: "all",
  dateFrom: "",
  dateTo: "",
  priceMin: "",
  priceMax: "",
  sort: "date",
};

function filtersFromSearchParams(sp: URLSearchParams): EventFilterState {
  return {
    category: sp.get("category") ?? "all",
    priceFilter: (sp.get("price") as EventFilterState["priceFilter"]) ?? "all",
    dateFrom: sp.get("dateFrom") ?? "",
    dateTo: sp.get("dateTo") ?? "",
    priceMin: sp.get("priceMin") ?? "",
    priceMax: sp.get("priceMax") ?? "",
    sort: (sp.get("sort") as EventSortOption) ?? "date",
  };
}

function toApiFilters(q: string, ui: EventFilterState): PublicEventFilters {
  return {
    q: q || undefined,
    category: ui.category !== "all" ? ui.category : undefined,
    dateFrom: ui.dateFrom || undefined,
    dateTo: ui.dateTo || undefined,
    priceMin: ui.priceMin || (ui.priceFilter === "paid" ? "1" : undefined),
    priceMax: ui.priceMax || undefined,
    free: ui.priceFilter === "free" ? true : undefined,
    sort: ui.sort,
  };
}

function EventsBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [filters, setFilters] = useState<EventFilterState>(() => filtersFromSearchParams(searchParams));
  const [showFilters, setShowFilters] = useState(false);

  const { data: categoriesData } = useEventCategories();
  const apiFilters = useMemo(() => toApiFilters(query, filters), [query, filters]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfinitePublicEvents(apiFilters);

  const events = data?.pages.flatMap((p) => p.events) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const categories = categoriesData?.categories ?? [];

  const syncUrl = useCallback(
    (nextQ: string, nextFilters: EventFilterState) => {
      const params = new URLSearchParams();
      if (nextQ.trim()) params.set("q", nextQ.trim());
      if (nextFilters.category !== "all") params.set("category", nextFilters.category);
      if (nextFilters.priceFilter !== "all") params.set("price", nextFilters.priceFilter);
      if (nextFilters.dateFrom) params.set("dateFrom", nextFilters.dateFrom);
      if (nextFilters.dateTo) params.set("dateTo", nextFilters.dateTo);
      if (nextFilters.priceMin) params.set("priceMin", nextFilters.priceMin);
      if (nextFilters.priceMax) params.set("priceMax", nextFilters.priceMax);
      if (nextFilters.sort !== "date") params.set("sort", nextFilters.sort);
      const qs = params.toString();
      router.replace(qs ? `/events?${qs}` : "/events", { scroll: false });
    },
    [router],
  );

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    syncUrl(query, filters);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setQuery("");
    router.replace("/events", { scroll: false });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Discover Events</h1>
            <p className="mt-2 text-muted-foreground">
              {isLoading ? "Searching..." : `${total} event${total === 1 ? "" : "s"} found`}
            </p>
          </div>
          <Button variant="outline" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="mr-2 h-5 w-5" />
            Filters
          </Button>
        </div>

        <div className="mb-8">
          <EventSearchBar value={query} onChange={setQuery} onSubmit={onSearch} />
        </div>

        <div className="flex gap-8">
          <aside className={`${showFilters ? "block" : "hidden"} w-full shrink-0 md:block md:w-64`}>
            <EventFiltersPanel
              filters={filters}
              categories={categories}
              onChange={(patch) => {
                const next = { ...filters, ...patch };
                setFilters(next);
                syncUrl(query, next);
              }}
              onClear={clearFilters}
            />
          </aside>

          <div className="flex-1">
            <EventInfiniteList
              events={events}
              hasMore={!!hasNextPage}
              isLoading={isLoading}
              isFetchingMore={isFetchingNextPage}
              onLoadMore={() => void fetchNextPage()}
              onClearFilters={clearFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventsBrowsePage() {
  return (
    <Suspense fallback={<Spinner label="Loading events" />}>
      <EventsBrowseContent />
    </Suspense>
  );
}
