"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type {
  BulkTransferTicketResult,
  TransferEligibility,
  TicketTransferDto,
  TransferTicketResult,
} from "@/lib/transfer/transfer.types";
import { bookingKeys } from "./use-booking";
import { checkinKeys } from "./use-checkin";

export const transferKeys = {
  eligibility: (ticketId: string) => ["transfer", "eligibility", ticketId] as const,
  ticketHistory: (ticketId: string) => ["transfer", "history", ticketId] as const,
  mine: ["transfer", "mine"] as const,
  admin: ["transfer", "admin"] as const,
};

export function useTransferEligibility(ticketId: string) {
  return useQuery({
    queryKey: transferKeys.eligibility(ticketId),
    queryFn: () => fetchJson<{ eligibility: TransferEligibility }>(`/api/tickets/t/${ticketId}/transfer`),
    enabled: !!ticketId,
  });
}

export function useTicketTransferHistory(ticketId: string) {
  return useQuery({
    queryKey: transferKeys.ticketHistory(ticketId),
    queryFn: () => fetchJson<{ history: TicketTransferDto[] }>(`/api/tickets/t/${ticketId}/transfers`),
    enabled: !!ticketId,
  });
}

export function useMyTransferHistory() {
  return useQuery({
    queryKey: transferKeys.mine,
    queryFn: () => fetchJson<{ history: TicketTransferDto[] }>("/api/tickets/transfers/mine"),
  });
}

export function useAdminTransfers() {
  return useQuery({
    queryKey: transferKeys.admin,
    queryFn: () =>
      fetchJson<{
        history: (TicketTransferDto & { fromUserEmail: string | null; toUserEmail: string | null; eventSlug: string })[];
      }>("/api/admin/transfers?limit=50"),
  });
}

function invalidateAfterTransfer(qc: ReturnType<typeof useQueryClient>, ticketIds?: string[]) {
  void qc.invalidateQueries({ queryKey: bookingKeys.myTickets });
  void qc.invalidateQueries({ queryKey: transferKeys.mine });
  for (const ticketId of ticketIds ?? []) {
    void qc.invalidateQueries({ queryKey: transferKeys.eligibility(ticketId) });
    void qc.invalidateQueries({ queryKey: transferKeys.ticketHistory(ticketId) });
    void qc.invalidateQueries({ queryKey: checkinKeys.ticketQr(ticketId) });
  }
}

export function useTransferTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { recipientEmail?: string; recipientPhone?: string }) =>
      fetchJson<TransferTicketResult>(`/api/tickets/t/${ticketId}/transfer`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      invalidateAfterTransfer(qc, [ticketId]);
    },
  });
}

export function useBulkTransferTickets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      ticketIds: string[];
      recipientEmail?: string;
      recipientPhone?: string;
    }) =>
      fetchJson<BulkTransferTicketResult>("/api/tickets/transfer", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) => {
      invalidateAfterTransfer(qc, variables.ticketIds);
    },
  });
}
