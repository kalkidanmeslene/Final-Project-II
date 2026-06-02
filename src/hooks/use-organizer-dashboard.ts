"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type { AttendeeRow, OrganizerDashboardData } from "@/lib/organizer-dashboard/organizer-dashboard.types";

export const organizerDashboardKeys = {
  all: ["organizer-dashboard"] as const,
  attendees: (eventId: string) => ["organizer-dashboard", "attendees", eventId] as const,
};

export function useOrganizerDashboard(initial?: OrganizerDashboardData) {
  return useQuery({
    queryKey: organizerDashboardKeys.all,
    queryFn: () => fetchJson<OrganizerDashboardData>("/api/organizer/dashboard"),
    initialData: initial,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useEventAttendees(eventId: string | null) {
  return useQuery({
    queryKey: organizerDashboardKeys.attendees(eventId ?? ""),
    queryFn: () => fetchJson<{ attendees: AttendeeRow[] }>(`/api/organizer/events/${eventId}/attendees`),
    enabled: !!eventId,
  });
}
