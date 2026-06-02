import type { BookingStatus, PaymentStatus } from "@prisma/client";

export type TicketTypeDto = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  capacity: number;
  soldCount: number;
  available: number;
};

export type BookingSummaryLine = {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type BookingSummary = {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  lines: BookingSummaryLine[];
  quantity: number;
  lineTotal: number;
  currency: string;
};

export type PaymentDto = {
  id: string;
  status: PaymentStatus;
  amount: number;
  referenceCode: string;
  failureReason: string | null;
  processedAt: string | null;
};

export type TicketDto = {
  id: string;
  ticketCode: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  ticketTypeName: string;
  status: string;
  checkedInAt: string | null;
  transferEnabled: boolean;
  canTransfer: boolean;
  transferBlockReason: string | null;
  createdAt: string;
};

export type BookingDto = {
  id: string;
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  createdAt: string;
  event: { id: string; title: string; slug: string; startsAt: string; venue: string; location: string };
  lines: { ticketTypeName: string; quantity: number; unitPrice: number; lineTotal: number }[];
  payment: PaymentDto | null;
  tickets: TicketDto[];
};
