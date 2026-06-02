"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClientError, fetchJson } from "@/lib/api/fetch-json";
import type {
  NotificationListResult,
  NotificationPreferencesDto,
} from "@/lib/notifications/notification.types";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly?: boolean) => ["notifications", "list", unreadOnly] as const,
  unread: ["notifications", "unread-count"] as const,
  preferences: ["notifications", "preferences"] as const,
};

export function useNotifications(unreadOnly = false) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("offset", String(pageParam));
      if (unreadOnly) params.set("unreadOnly", "true");
      return fetchJson<NotificationListResult>(`/api/notifications?${params.toString()}`);
    },
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    refetchInterval: 15_000,
  });
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: async () => {
      try {
        return await fetchJson<{ unreadCount: number }>("/api/notifications/unread-count");
      } catch (e) {
        if (e instanceof ApiClientError && e.status === 401) {
          return { unreadCount: 0 };
        }
        throw e;
      }
    },
    enabled,
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: (failureCount, error) =>
      !(error instanceof ApiClientError && error.status === 401) && failureCount < 1,
  });
}

export function useNotificationPreferences(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: () => fetchJson<{ preferences: NotificationPreferencesDto }>("/api/notifications/preferences"),
    enabled,
    retry: (failureCount, error) =>
      !(error instanceof ApiClientError && error.status === 401) && failureCount < 1,
  });
}

export function useNotificationMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: notificationKeys.all });
  };

  const markRead = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ read: true }>(`/api/notifications/${id}/read`, { method: "PATCH", body: "{}" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      qc.setQueriesData<NotificationListResult>({ queryKey: ["notifications", "list"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n) =>
            n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n,
          ),
          unreadCount: Math.max(0, old.unreadCount - 1),
        };
      });
      qc.setQueryData(notificationKeys.unread, (old: { unreadCount: number } | undefined) =>
        old ? { unreadCount: Math.max(0, old.unreadCount - 1) } : old,
      );
    },
    onSettled: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => fetchJson<{ marked: number }>("/api/notifications/read-all", { method: "POST", body: "{}" }),
    onSuccess: invalidate,
  });

  const updatePreferences = useMutation({
    mutationFn: (body: Partial<NotificationPreferencesDto>) =>
      fetchJson<{ preferences: NotificationPreferencesDto }>("/api/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: notificationKeys.preferences });
      const prev = qc.getQueryData<{ preferences: NotificationPreferencesDto }>(notificationKeys.preferences);
      if (prev) {
        qc.setQueryData(notificationKeys.preferences, {
          preferences: { ...prev.preferences, ...body },
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationKeys.preferences, ctx.prev);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: notificationKeys.preferences }),
  });

  const sendAnnouncement = useMutation({
    mutationFn: ({ eventId, title, message }: { eventId: string; title: string; message: string }) =>
      fetchJson<{ recipientCount: number }>(`/api/events/e/${eventId}/announcements`, {
        method: "POST",
        body: JSON.stringify({ title, message }),
      }),
  });

  return { markRead, markAllRead, updatePreferences, sendAnnouncement };
}
