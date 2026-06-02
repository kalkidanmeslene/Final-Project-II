/**
 * @deprecated Use `next-intl` (`useLocale`, `useTranslations`) and `@/i18n/navigation` instead.
 */
"use client";

import { useLocale } from "next-intl";
import type { ReactNode } from "react";

export type Language = "en" | "am";

export function LanguageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useLanguage() {
  const locale = useLocale() as Language;
  return {
    language: locale,
    setLanguage: () => {
      console.warn("useLanguage().setLanguage is deprecated. Use LanguageSwitcher.");
    },
    toggleLanguage: () => {
      console.warn("useLanguage().toggleLanguage is deprecated. Use LanguageSwitcher.");
    },
  };
}
