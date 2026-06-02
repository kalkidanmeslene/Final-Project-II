"use client";

import { useEffect, useRef } from "react";
import type { EventListItem } from "@/lib/events/event.types";
import { EventGrid } from "./event-grid";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

type Props = {
  events: EventListItem[];
  hasMore: boolean;
  isLoading: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  onClearFilters?: () => void;
};

export function EventInfiniteList({
  events,
  hasMore,
  isLoading,
  isFetchingMore,
  onLoadMore,
  onClearFilters,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isFetchingMore, onLoadMore]);

  if (isLoading) {
    return <Spinner label="Loading events" />;
  }

  return (
    <div className="space-y-8">
      <EventGrid events={events} onClearFilters={onClearFilters} />

      {hasMore && (
        <div ref={sentinelRef} className="flex flex-col items-center gap-3 py-4">
          {isFetchingMore ? (
            <Spinner label="Loading more" />
          ) : (
            <Button variant="outline" type="button" onClick={onLoadMore}>
              Load more events
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
