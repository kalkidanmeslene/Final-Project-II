import type { EventListItem } from "@/lib/events/event.types";
import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";

type Props = {
  events: EventListItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  onClearFilters?: () => void;
};

export function EventGrid({
  events,
  emptyTitle = "No events found",
  emptyDescription = "Try adjusting your search or filters.",
  onClearFilters,
}: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
        <p className="text-lg font-semibold">{emptyTitle}</p>
        <p className="mt-2 text-muted-foreground">{emptyDescription}</p>
        {onClearFilters && (
          <Button variant="primary" className="mt-6" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
