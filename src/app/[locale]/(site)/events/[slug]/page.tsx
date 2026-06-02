import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getEventBySlug } from "@/lib/events/event.service";
import { buildEventJsonLd, buildEventMetadata } from "@/lib/discovery/event-seo";
import { EventDetailClient } from "@/components/events/event-detail-client";
import { isAppLocale } from "@/i18n/routing";
import { getEventBookActionLabel } from "@/lib/i18n/event-labels";

type Props = { params: Promise<{ slug: string }> };

async function loadEventForPage(slug: string) {
  const user = await getCurrentUser();
  const viewer = user ? { userId: user.id, role: user.role } : undefined;
  return getEventBySlug(slug, viewer);
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const event = await loadEventForPage(slug);
  if (!event) return { title: "Event not found | Hibir Events" };
  return buildEventMetadata(event);
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await loadEventForPage(slug);
  if (!event) notFound();

  const jsonLd = buildEventJsonLd(event);
  const localeParam = await getLocale();
  const locale = isAppLocale(localeParam) ? localeParam : "en";
  const bookActionLabel = getEventBookActionLabel(locale, event.ticketPrice);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <EventDetailClient
        event={event}
        bookActionLabel={bookActionLabel}
        preview={event.status !== "approved"}
      />
    </>
  );
}
