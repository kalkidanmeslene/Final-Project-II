"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isAppLocale, type AppLocale } from "@/i18n/routing";
import { useAuth } from "@/hooks/use-auth";

/** Aligns URL locale with the signed-in user's preferred language once per session. */
export function UserLocaleSync() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const synced = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !user || synced.current) return;
    const preferred = user.preferredLanguage;
    if (!isAppLocale(preferred) || preferred === locale) {
      synced.current = true;
      return;
    }
    synced.current = true;
    router.replace(pathname, { locale: preferred as AppLocale });
  }, [mounted, user, locale, pathname, router]);

  return null;
}
