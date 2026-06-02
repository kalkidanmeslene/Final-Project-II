import type { AppLocale } from "@/i18n/routing";
import type { CalendarSystem } from "@/lib/calendar/calendar.types";
import { formatLocalizedDate, formatLocalizedTime } from "@/lib/calendar/format";

/** @deprecated Prefer `useLocalizedFormat()` in client components or `formatLocalizedDate` on the server. */
export function formatDate(
  date: Date | string,
  locale: AppLocale = "en",
  calendar: CalendarSystem = "gregorian",
): string {
  return formatLocalizedDate(date, { locale, calendar });
}

/** @deprecated Prefer `useLocalizedFormat()` or `formatLocalizedTime`. */
export function formatTime(date: Date | string, locale: AppLocale = "en"): string {
  return formatLocalizedTime(date, locale);
}

export function formatCurrency(amount: number, locale: AppLocale = "en"): string {
  const prefix = locale === "am" ? "ብር " : "ETB ";
  return `${prefix}${amount.toLocaleString(locale === "am" ? "am-ET" : "en-ET")}`;
}

export { formatLocalizedDate, formatLocalizedDateTime, formatLocalizedTime } from "@/lib/calendar/format";
