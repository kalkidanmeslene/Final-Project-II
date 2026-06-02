"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import type { NotificationDto } from "@/lib/notifications/notification.types";
import { formatDate, formatTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useNotificationMutations, useNotifications } from "@/hooks/use-notifications";
import { notificationIcon, notificationIconStyles } from "./notification-icon";

function NotificationItem({ item, onRead }: { item: NotificationDto; onRead: (id: string) => void }) {
  const router = useRouter();
  const Icon = notificationIcon(item.type);

  function open() {
    if (!item.read) onRead(item.id);
    if (item.event?.slug) router.push(`/events/${item.event.slug}`);
  }

  return (
    <button
      type="button"
      onClick={open}
      className={`w-full rounded-xl border bg-card p-6 text-left shadow-sm transition-all hover:shadow-md ${
        item.read ? "border-border" : "border-primary/30 bg-primary/5"
      }`}
    >
      <div className="flex gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${notificationIconStyles(item.type)}`}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            {!item.read && (
              <Badge variant="info" className="shrink-0">
                New
              </Badge>
            )}
          </div>
          <p className="mb-3 text-muted-foreground">{item.body}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function NotificationCenter() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useNotifications();
  const { markRead, markAllRead } = useNotificationMutations();

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  if (isLoading) {
    return <Spinner label="Loading notifications" />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 ? (
            <p className="mt-1 text-muted-foreground">
              You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground">You&apos;re all caught up</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/profile/notifications">
            <Button variant="outline" type="button">
              Preferences
            </Button>
          </Link>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              type="button"
              disabled={markAllRead.isPending}
              onClick={() => void markAllRead.mutateAsync()}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <Bell className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">No notifications yet</h3>
          <p className="text-muted-foreground">
            Booking confirmations, reminders, and event updates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onRead={(id) => void markRead.mutate(id)}
            />
          ))}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                type="button"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
