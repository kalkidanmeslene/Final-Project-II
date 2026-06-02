"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Calendar, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { EventListItem } from "@/lib/events/event.types";
import { formatCurrency } from "@/lib/format";
import { LocalizedDate } from "@/components/locale/localized-date";
import { useLocalizedFormat } from "@/hooks/use-localized-format";
import { RatingDisplay } from "@/components/reviews/star-rating";

export function EventCard({ event }: { event: EventListItem }) {
  const t = useTranslations("events");
  const { formatTime, locale } = useLocalizedFormat();
  const isFree = event.ticketPrice === 0;

  return (
    <Link href={`/events/${event.slug}`} className="block">
      <article className="cursor-pointer overflow-hidden rounded-xl bg-card shadow-md transition-shadow hover:shadow-lg">
        <div className="relative h-48 overflow-hidden">
          {event.bannerUrl ? (
            <Image
              src={event.bannerUrl}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-secondary text-muted-foreground">
              No image
            </div>
          )}
          {isFree && (
            <div className="absolute top-3 right-3 rounded-lg bg-success px-3 py-1 text-sm font-semibold text-success-foreground">
              {t("free")}
            </div>
          )}
        </div>
        <div className="space-y-3 p-4">
          <h3 className="line-clamp-2 text-lg font-semibold text-card-foreground">{event.title}</h3>
          {event.reviewCount > 0 && (
            <RatingDisplay averageRating={event.averageRating} reviewCount={event.reviewCount} size="sm" />
          )}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-primary" />
              <span>
                <LocalizedDate value={event.startsAt} /> · {formatTime(event.startsAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="line-clamp-1">
                {event.venue}, {event.location}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-sm text-muted-foreground">{event.organizer.fullName}</span>
            <span className="text-lg font-semibold text-primary">
              {isFree ? t("free") : formatCurrency(event.ticketPrice, locale)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
