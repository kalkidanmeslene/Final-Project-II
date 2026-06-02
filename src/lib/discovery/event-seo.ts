import type { Metadata } from "next";
import type { EventDetail } from "@/lib/events/event.types";
import { env } from "@/lib/env";

export function buildEventMetadata(event: EventDetail): Metadata {
  const base = env.APP_BASE_URL ?? "http://localhost:3000";
  const url = `${base}/events/${event.slug}`;
  const description = event.description.slice(0, 160).replace(/\s+/g, " ").trim();

  return {
    title: `${event.title} | Hibir Events`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: event.title,
      description,
      siteName: "Hibir Events",
      ...(event.bannerUrl ? { images: [{ url: event.bannerUrl, alt: event.title }] } : {}),
    },
    twitter: {
      card: event.bannerUrl ? "summary_large_image" : "summary",
      title: event.title,
      description,
      ...(event.bannerUrl ? { images: [event.bannerUrl] } : {}),
    },
  };
}

export function buildEventJsonLd(event: EventDetail) {
  const base = env.APP_BASE_URL ?? "http://localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt,
    endDate: event.endsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: event.location,
    },
    image: event.bannerUrl ? [event.bannerUrl] : undefined,
    organizer: {
      "@type": "Organization",
      name: event.organizer.fullName,
    },
    offers: {
      "@type": "Offer",
      price: event.ticketPrice,
      priceCurrency: "ETB",
      availability:
        event.availability.available > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      url: `${base}/events/${event.slug}/book`,
    },
  };
}
