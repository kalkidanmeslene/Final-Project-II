"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type {
  CheckinAnalytics,
  EventStaffDto,
  ScanHistoryItem,
  ScanResponse,
  TicketQrDto,
} from "@/lib/checkin/checkin.types";

export const checkinKeys = {
  analytics: (eventId: string) => ["checkin", "analytics", eventId] as const,
  history: (eventId: string) => ["checkin", "history", eventId] as const,
  staff: (eventId: string) => ["checkin", "staff", eventId] as const,
  ticketQr: (ticketId: string) => ["checkin", "qr", ticketId] as const,
};

export function useTicketQr(ticketId: string) {
  return useQuery({
    queryKey: checkinKeys.ticketQr(ticketId),
    queryFn: () => fetchJson<{ qr: TicketQrDto }>(`/api/tickets/t/${ticketId}/qr`),
    enabled: !!ticketId,
    staleTime: 60_000,
  });
}

export function useCheckinAnalytics(eventId: string) {
  return useQuery({
    queryKey: checkinKeys.analytics(eventId),
    queryFn: () => fetchJson<{ analytics: CheckinAnalytics }>(`/api/events/e/${eventId}/checkin/analytics`),
    enabled: !!eventId,
    refetchInterval: 15_000,
  });
}

export function useScanHistory(eventId: string) {
  return useQuery({
    queryKey: checkinKeys.history(eventId),
    queryFn: () =>
      fetchJson<{ history: ScanHistoryItem[] }>(`/api/events/e/${eventId}/checkin/history?limit=50`),
    enabled: !!eventId,
    refetchInterval: 10_000,
  });
}

export function useEventStaff(eventId: string) {
  return useQuery({
    queryKey: checkinKeys.staff(eventId),
    queryFn: () => fetchJson<{ staff: EventStaffDto[] }>(`/api/events/e/${eventId}/staff`),
    enabled: !!eventId,
  });
}

export function useCheckinMutations(eventId: string) {
  const qc = useQueryClient();

  const scan = useMutation({
    mutationFn: (payload: string) =>
      fetchJson<{ scan: ScanResponse }>(`/api/events/e/${eventId}/checkin/scan`, {
        method: "POST",
        body: JSON.stringify({ payload }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: checkinKeys.analytics(eventId) });
      void qc.invalidateQueries({ queryKey: checkinKeys.history(eventId) });
    },
  });

  const addStaff = useMutation({
    mutationFn: (body: { email: string; role: "scanner" | "manager" }) =>
      fetchJson<{ staff: EventStaffDto }>(`/api/events/e/${eventId}/staff`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: checkinKeys.staff(eventId) });
    },
  });

  const removeStaff = useMutation({
    mutationFn: (staffId: string) =>
      fetchJson<{ removed: boolean }>(`/api/events/e/${eventId}/staff/${staffId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: checkinKeys.staff(eventId) });
    },
  });

  return { scan, addStaff, removeStaff };
}
