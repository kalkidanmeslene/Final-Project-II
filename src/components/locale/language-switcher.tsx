"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { fetchJson } from "@/lib/api/fetch-json";

export function LanguageSwitcher({ className, variant = "toggle" }: { className?: string; variant?: "toggle" | "pills" }) {
  const t = useTranslations("language");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  async function switchTo(next: AppLocale) {
    if (next === locale) return;

    if (user) {
      try {
        await fetchJson("/api/profile/locale", {
          method: "PATCH",
          body: JSON.stringify({ preferredLanguage: next }),
        });
      } catch {
        // Non-blocking — cookie and URL still update
      }
    }

    router.replace(pathname, { locale: next });
  }

  if (variant === "pills") {
    return (
      <div className={cn("flex justify-center gap-2", className)} role="group" aria-label={t("label")}>
        {(["en", "am"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => void switchTo(lang)}
            className={cn(
              "rounded-lg px-4 py-2 font-medium transition-colors",
              locale === lang
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {lang === "en" ? t("english") : t("amharic")}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void switchTo(locale === "en" ? "am" : "en")}
      className={cn("flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-secondary", className)}
      aria-label={t("label")}
    >
      <Globe className="h-5 w-5" />
      <span className="text-sm font-medium">{locale === "en" ? t("english") : t("amharic")}</span>
    </button>
  );
}
