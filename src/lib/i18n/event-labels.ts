import type { AppLocale } from "@/i18n/routing";
import am from "../../../messages/am.json";
import en from "../../../messages/en.json";

const catalogs = { en, am } as const;

export function getEventBookActionLabel(locale: AppLocale, ticketPrice: number): string {
  const { rsvp, bookTicket } = catalogs[locale].events;
  return ticketPrice === 0 ? rsvp : bookTicket;
}
