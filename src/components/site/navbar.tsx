"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, User } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { LanguageSwitcher } from "@/components/locale/language-switcher";
import { CalendarSwitcher } from "@/components/locale/calendar-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useAuth } from "@/hooks/use-auth";
import { defaultDashboardPath } from "@/lib/auth/rbac";

export function Navbar() {
  const t = useTranslations("nav");
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/events?q=${encodeURIComponent(q)}` : "/events");
  }

  return (
    <nav className="sticky top-0 z-50 hidden border-b border-border bg-card shadow-sm md:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <form onSubmit={onSearch} className="mx-4 max-w-xl flex-1">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <CalendarSwitcher />
          <LanguageSwitcher />
          {user ? (
            <>
              <NotificationBell />
              <Link
                href={defaultDashboardPath(user.role, user.status)}
                className="rounded-lg p-2 transition-colors hover:bg-secondary"
                aria-label={t("dashboard")}
              >
                <User className="h-5 w-5" />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  {t("signUp")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
