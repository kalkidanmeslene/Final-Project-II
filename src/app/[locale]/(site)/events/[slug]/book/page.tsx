"use client";

import { useParams } from "next/navigation";
import { useEvent } from "@/hooks/use-events";
import { BookingCheckoutFlow } from "@/components/booking/booking-checkout-flow";
import { Spinner } from "@/components/ui/spinner";

export default function BookEventPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const { data, isLoading } = useEvent(slug);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (!data?.event) {
    return <p className="px-6 py-12 text-center text-muted-foreground">Event not found.</p>;
  }

  if (data.event.status !== "approved") {
    return <p className="px-6 py-12 text-center text-muted-foreground">This event is not open for booking.</p>;
  }

  const event = data.event;

  return (
    <BookingCheckoutFlow
      slug={slug}
      eventTitle={event.title}
      eventStartsAt={event.startsAt}
      eventLocation={`${event.venue}, ${event.location}`}
    />
  );
}
