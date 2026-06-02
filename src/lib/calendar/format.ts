import type { FormatDateOptions } from "./calendar.types";
import { formatEthiopianDate } from "./ethiopian";

const INTL_LOCALE: Record<"en" | "am", string> = {
  en: "en-ET",
  am: "am-ET",
};

export function formatLocalizedDate(
  input: Date | string,
  { locale, calendar, includeTime = false, dateStyle = "medium" }: FormatDateOptions,
): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";

  if (calendar === "ethiopian") {
    const ethDate = formatEthiopianDate(date, locale);
    if (!includeTime) return ethDate;
    const time = formatLocalizedTime(date, locale);
    return `${ethDate} · ${time}`;
  }

  const intlLocale = INTL_LOCALE[locale];
  const datePart = new Intl.DateTimeFormat(intlLocale, {
    weekday: dateStyle === "full" ? "long" : "short",
    year: "numeric",
    month: dateStyle === "short" ? "short" : "long",
    day: "numeric",
  }).format(date);

  if (!includeTime) return datePart;
  return `${datePart} · ${formatLocalizedTime(date, locale)}`;
}

export function formatLocalizedTime(input: Date | string, locale: "en" | "am"): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatLocalizedDateTime(input: Date | string, options: FormatDateOptions): string {
  return formatLocalizedDate(input, { ...options, includeTime: true });
}
