import { defineRouting } from "next-intl/routing";

export const locales = ["en", "am"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
});

export function isAppLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}

/** Path without locale prefix (e.g. `/am/events` → `/events`). */
export function stripLocalePrefix(pathname: string): string {
  for (const locale of locales) {
    if (locale === routing.defaultLocale && routing.localePrefix === "as-needed") {
      continue;
    }
    const prefix = `/${locale}`;
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length) || "/";
    }
  }
  if (pathname.startsWith("/am/")) return pathname.slice(3) || "/";
  if (pathname === "/am") return "/";
  return pathname;
}

export function localePath(path: string, locale: AppLocale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === routing.defaultLocale && routing.localePrefix === "as-needed") {
    return normalized;
  }
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}
