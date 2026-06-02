import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const PUBLIC_PATHS = ["/", "/events", "/login", "/signup"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [];

  for (const path of PUBLIC_PATHS) {
    for (const locale of routing.locales) {
      const url =
        locale === routing.defaultLocale && routing.localePrefix === "as-needed"
          ? `${base}${path === "/" ? "" : path}`
          : `${base}/${locale}${path === "/" ? "" : path}`;

      entries.push({
        url,
        alternates: {
          languages: {
            en: `${base}${path === "/" ? "" : path}`,
            am: `${base}/am${path === "/" ? "" : path}`,
          },
        },
      });
    }
  }

  return entries;
}
