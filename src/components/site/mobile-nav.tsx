"use client";

import { useTranslations } from "next-intl";
import { Home, Search, Ticket, User } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Home", match: (p: string) => p === "/" },
    { path: "/events", icon: Search, label: "Search", match: (p: string) => p.startsWith("/events") },
    {
      path: "/dashboard/attendee/tickets",
      icon: Ticket,
      label: "Tickets",
      match: (p: string) => p.includes("/tickets"),
    },
    {
      path: "/profile",
      icon: User,
      label: "Profile",
      match: (p: string) => p.startsWith("/profile") || p.startsWith("/dashboard"),
    },
  ] as const;

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-border bg-card shadow-lg md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const href =
            item.label === "Tickets" && user
              ? user.role === "organizer" && user.status !== "pending"
                ? "/dashboard/organizer/events"
                : "/dashboard/attendee/tickets"
              : item.path;
          const active = item.match(pathname);
          const label =
            item.label === "Home"
              ? t("home")
              : item.label === "Search"
                ? t("search")
                : item.label === "Tickets"
                  ? t("tickets")
                  : t("profile");

          return (
            <Link
              key={item.path}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
