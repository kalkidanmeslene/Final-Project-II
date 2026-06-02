import Link from "next/link";
import type { EventListItem } from "@/lib/events/event.types";
import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  title: string;
  subtitle?: string;
  events: EventListItem[];
  isLoading?: boolean;
  viewAllHref?: string;
  emptyMessage?: string;
};

export function EventSection({
  title,
  subtitle,
  events,
  isLoading,
  viewAllHref = "/events",
  emptyMessage = "No events in this section yet.",
}: Props) {
  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref}>
            <Button variant="outline">View all</Button>
          </Link>
        )}
      </div>
      {isLoading ? (
        <Spinner label={`Loading ${title.toLowerCase()}`} />
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">{emptyMessage}</p>
      )}
    </section>
  );
}
