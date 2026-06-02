"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type { BookingDto, BookingSummary, TicketDto, TicketTypeDto } from "@/lib/booking/booking.types";

export const bookingKeys = {
  ticketTypes: (slug: string) => ["booking", "ticket-types", slug] as const,
  history: ["booking", "history"] as const,
  myTickets: ["booking", "my-tickets"] as const,
  detail: (id: string) => ["booking", "detail", id] as const,
};

export function useTicketTypes(slug: string) {
  return useQuery({
    queryKey: bookingKeys.ticketTypes(slug),
    queryFn: () =>
      fetchJson<{ eventId: string; eventTitle: string; eventSlug: string; ticketTypes: TicketTypeDto[] }>(
        `/api/events/s/${slug}/ticket-types`,
      ),
    enabled: !!slug,
  });
}

export function useBookingHistory() {
  return useQuery({
    queryKey: bookingKeys.history,
    queryFn: () => fetchJson<{ bookings: BookingDto[] }>("/api/bookings/history"),
  });
}

export function useMyTickets() {
  return useQuery({
    queryKey: bookingKeys.myTickets,
    queryFn: () => fetchJson<{ tickets: TicketDto[] }>("/api/tickets/mine"),
  });
}

export function useBookingCheckout(slug: string) {
  const qc = useQueryClient();

  const preview = useMutation({
    mutationFn: (body: { lines: { ticketTypeId: string; quantity: number }[] }) =>
      fetchJson<{ summary: BookingSummary }>(`/api/events/s/${slug}/checkout/preview`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });

  const complete = useMutation({
    mutationFn: (body: { lines: { ticketTypeId: string; quantity: number }[]; paymentResult: "success" | "fail" }) =>
      fetchJson<{ paymentStatus: string; booking: BookingDto }>(`/api/events/s/${slug}/checkout`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookingKeys.history });
      void qc.invalidateQueries({ queryKey: bookingKeys.myTickets });
      void qc.invalidateQueries({ queryKey: bookingKeys.ticketTypes(slug) });
      void qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  return { preview, complete };
}
