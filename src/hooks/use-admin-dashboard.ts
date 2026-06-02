"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type { EventListItem } from "@/lib/events/event.types";
import type {
  AdminAuditRow,
  AdminCategoryRow,
  AdminDashboardData,
  AdminLocationRow,
  AdminOrganizerApplication,
  AdminUserRow,
  PaginatedResult,
  PlatformSettings,
} from "@/lib/admin-dashboard/admin-dashboard.types";

export const adminDashboardKeys = {
  all: ["admin-dashboard"] as const,
  users: (params: string) => ["admin-dashboard", "users", params] as const,
  audit: (params: string) => ["admin-dashboard", "audit", params] as const,
  applications: ["admin-dashboard", "applications"] as const,
  pendingEvents: ["admin-dashboard", "pending-events"] as const,
  categories: ["admin-dashboard", "categories"] as const,
  locations: ["admin-dashboard", "locations"] as const,
  settings: ["admin-dashboard", "settings"] as const,
};

export function useAdminDashboard(initial?: AdminDashboardData) {
  return useQuery({
    queryKey: adminDashboardKeys.all,
    queryFn: () => fetchJson<AdminDashboardData>("/api/admin/dashboard"),
    initialData: initial,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useAdminUsers(params: {
  role?: string;
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params.role) qs.set("role", params.role);
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  qs.set("limit", String(params.limit ?? 20));
  qs.set("offset", String(params.offset ?? 0));
  const key = qs.toString();

  return useQuery({
    queryKey: adminDashboardKeys.users(key),
    queryFn: () => fetchJson<PaginatedResult<AdminUserRow>>(`/api/admin/users?${key}`),
  });
}

export function useAdminAuditLogs(params: { action?: string; q?: string; limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params.action) qs.set("action", params.action);
  if (params.q) qs.set("q", params.q);
  qs.set("limit", String(params.limit ?? 30));
  qs.set("offset", String(params.offset ?? 0));
  const key = qs.toString();

  return useQuery({
    queryKey: adminDashboardKeys.audit(key),
    queryFn: () => fetchJson<PaginatedResult<AdminAuditRow>>(`/api/admin/audit-logs?${key}`),
  });
}

export function useAdminApplications() {
  return useQuery({
    queryKey: adminDashboardKeys.applications,
    queryFn: () =>
      fetchJson<{
        organizers: {
          userId: string;
          fullName: string;
          email: string | null;
          organizationName: string;
          createdAt: string;
        }[];
      }>("/api/admin/organizers/pending"),
    select: (d): AdminOrganizerApplication[] =>
      d.organizers.map((a) => ({
        userId: a.userId,
        fullName: a.fullName,
        email: a.email,
        organizationName: a.organizationName,
        organizationWebsite: null,
        createdAt: a.createdAt,
      })),
  });
}

export function useAdminPendingEventsList() {
  return useQuery({
    queryKey: adminDashboardKeys.pendingEvents,
    queryFn: () => fetchJson<{ events: EventListItem[] }>("/api/admin/events/pending"),
    select: (d) => d.events,
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: adminDashboardKeys.categories,
    queryFn: () => fetchJson<{ categories: AdminCategoryRow[] }>("/api/admin/categories"),
    select: (d) => d.categories,
  });
}

export function useAdminLocations() {
  return useQuery({
    queryKey: adminDashboardKeys.locations,
    queryFn: () => fetchJson<{ locations: AdminLocationRow[] }>("/api/admin/locations"),
    select: (d) => d.locations,
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: adminDashboardKeys.settings,
    queryFn: () => fetchJson<{ settings: PlatformSettings }>("/api/admin/settings"),
    select: (d) => d.settings,
  });
}

export function useAdminMutations() {
  const qc = useQueryClient();

  function invalidateAll() {
    void qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    void qc.invalidateQueries({ queryKey: ["events", "admin"] });
  }

  const suspendUser = useMutation({
    mutationFn: (userId: string) => fetchJson(`/api/admin/users/${userId}/suspend`, { method: "POST" }),
    onSuccess: invalidateAll,
  });

  const unsuspendUser = useMutation({
    mutationFn: (userId: string) => fetchJson(`/api/admin/users/${userId}/unsuspend`, { method: "POST" }),
    onSuccess: invalidateAll,
  });

  const approveOrganizer = useMutation({
    mutationFn: ({ userId, note }: { userId: string; note?: string }) =>
      fetchJson(`/api/admin/organizers/${userId}/approve`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    onSuccess: invalidateAll,
  });

  const rejectOrganizer = useMutation({
    mutationFn: ({ userId, note }: { userId: string; note?: string }) =>
      fetchJson(`/api/admin/organizers/${userId}/reject`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    onSuccess: invalidateAll,
  });

  const approveEvent = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      fetchJson(`/api/admin/events/${id}/approve`, { method: "POST", body: JSON.stringify({ note }) }),
    onSuccess: invalidateAll,
  });

  const rejectEvent = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      fetchJson(`/api/admin/events/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
    onSuccess: invalidateAll,
  });

  const createCategory = useMutation({
    mutationFn: (body: { name: string; slug?: string; description?: string }) =>
      fetchJson("/api/admin/categories", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: invalidateAll,
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => fetchJson(`/api/admin/categories/${id}`, { method: "DELETE" }),
    onSuccess: invalidateAll,
  });

  const createLocation = useMutation({
    mutationFn: (body: {
      name: string;
      city: string;
      region?: string;
      country?: string;
      isActive?: boolean;
      sortOrder?: number;
    }) => fetchJson("/api/admin/locations", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: invalidateAll,
  });

  const deleteLocation = useMutation({
    mutationFn: (id: string) => fetchJson(`/api/admin/locations/${id}`, { method: "DELETE" }),
    onSuccess: invalidateAll,
  });

  const updateSettings = useMutation({
    mutationFn: (body: Partial<PlatformSettings>) =>
      fetchJson<{ settings: PlatformSettings }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: invalidateAll,
  });

  return {
    suspendUser,
    unsuspendUser,
    approveOrganizer,
    rejectOrganizer,
    approveEvent,
    rejectEvent,
    createCategory,
    deleteCategory,
    createLocation,
    deleteLocation,
    updateSettings,
  };
}
