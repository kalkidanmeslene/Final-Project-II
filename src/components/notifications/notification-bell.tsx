"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

export function NotificationBell() {
  const { user, loading } = useAuth();
  const { data } = useUnreadNotificationCount(!!user && !loading);
  const unread = data?.unreadCount ?? 0;

  if (!user) return null;

  return (
    <Link
      href="/notifications"
      className="relative rounded-lg p-2 transition-colors hover:bg-secondary"
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
