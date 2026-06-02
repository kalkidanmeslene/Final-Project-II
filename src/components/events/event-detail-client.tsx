"use client";

import Image from "next/image";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/events/event-card";
import { EventReviewsSection } from "@/components/reviews/event-reviews-section";
import { RatingDisplay } from "@/components/reviews/star-rating";
import { usePublicEvents } from "@/hooks/use-events";
import type { EventDetail } from "@/lib/events/event.types";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";

export function EventDetailClient({
  event,
  bookActionLabel,
  preview = false,
}: {
  event: EventDetail;
  bookActionLabel?: string;
  /** Organizer/admin preview before the event is approved and public. */
  preview?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const bookPath = `/events/${event.slug}/book` as const;

  const { data: relatedData } = usePublicEvents({
    category: event.category.slug,
    sort: "date",
  });

  const similarEvents = (relatedData?.events ?? [])
    .filter((e) => e.slug !== event.slug && e.category.slug === event.category.slug)
    .slice(0, 3);

  const isFree = event.ticketPrice === 0;
  const canBook = event.status === "approved" && event.availability.available > 0;
  const actionLabel = bookActionLabel ?? (isFree ? "RSVP" : "Book ticket");

  return (
    <div className="min-h-screen bg-background">
      {preview && (
        <div className="border-b border-border bg-secondary/50 px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Alert>
              Preview only — this event is <strong>{event.status}</strong> and is not visible to the public yet.
              Submit for approval to publish it on the events listing.
            </Alert>
          </div>
        </div>
      )}
      <div className="relative h-[400px] w-full overflow-hidden bg-gray-900 md:h-[500px]">
        {event.bannerUrl ? (
          <Image src={event.bannerUrl} alt={event.title} fill className="object-cover opacity-90" priority sizes="100vw" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No banner</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 p-6 text-white md:p-8">
          <div className="mx-auto max-w-7xl">
            <Badge variant="info" className="mb-4">
              {event.category.name.toUpperCase()}
            </Badge>
            <h1 className="mb-4 text-3xl font-bold md:text-5xl">{event.title}</h1>
            <div className="mb-3">
              <RatingDisplay averageRating={event.averageRating} reviewCount={event.reviewCount} />
            </div>
            <div className="flex flex-wrap gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>
                  {formatDate(event.startsAt)} • {formatTime(event.startsAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>
                  {event.venue}, {event.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-8">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">About This Event</h2>
              <p className="leading-relaxed whitespace-pre-line text-foreground/90">{event.description}</p>
            </div>

            {event.gallery.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-2xl font-bold">Photos</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {event.gallery.map((m) => (
                    <div
                      key={m.id}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-zinc-100"
                    >
                      <Image
                        src={m.url}
                        alt={`${event.title} photo`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 33vw"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Event Details</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-1 text-sm text-muted-foreground">Date & Time</h4>
                  <p className="font-semibold">
                    {formatDate(event.startsAt)}
                    <br />
                    {formatTime(event.startsAt)}
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 text-sm text-muted-foreground">Location</h4>
                  <p className="font-semibold">
                    {event.venue}, {event.location}
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 text-sm text-muted-foreground">Organizer</h4>
                  <p className="font-semibold">{event.organizer.fullName}</p>
                </div>
              </div>
            </div>

            {similarEvents.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl font-bold">Similar Events</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {similarEvents.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </div>
            )}

            <EventReviewsSection
              eventSlug={event.slug}
              eventTitle={event.title}
              summary={{
                averageRating: event.averageRating,
                reviewCount: event.reviewCount,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              }}
            />
          </div>

          <div className="shrink-0 lg:w-96">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-lg">
              <div className="mb-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-primary">
                    {isFree ? "Free" : formatCurrency(event.ticketPrice)}
                  </span>
                  {!isFree && <span className="text-sm text-muted-foreground">per ticket</span>}
                </div>
              </div>

              {canBook ? (
                authLoading ? (
                  <Button size="lg" className="mb-3 w-full" disabled>
                    Loading…
                  </Button>
                ) : user ? (
                  <Link
                    href={bookPath}
                    className="mb-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                  >
                    <Calendar className="h-5 w-5" />
                    {actionLabel}
                  </Link>
                ) : (
                  <div className="mb-3 space-y-3">
                    <p className="text-center text-sm text-muted-foreground">
                      {isFree
                        ? "Sign in or create an account to RSVP for this event."
                        : "Sign in or create an account to book tickets."}
                    </p>
                    <Link
                      href={`/login?next=${encodeURIComponent(bookPath)}`}
                      className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                    >
                      Log in
                    </Link>
                    <Link
                      href={`/signup?next=${encodeURIComponent(bookPath)}`}
                      className="inline-flex h-12 w-full items-center justify-center rounded-xl border-2 border-primary bg-transparent px-8 text-lg font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                    >
                      Sign up
                    </Link>
                  </div>
                )
              ) : (
                <Button size="lg" className="mb-3 w-full" disabled>
                  {event.availability.available === 0 ? "Sold Out" : "Not Available"}
                </Button>
              )}

              <div className="mt-6 border-t border-border pt-6">
                <h4 className="mb-3 font-semibold">Why book with us?</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {["Secure QR code verification", "Instant ticket delivery", "Easy ticket transfer"].map((text) => (
                    <li key={text} className="flex items-start gap-2">
                      <ChevronRight className="mt-0.5 h-4 w-4 text-success" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
