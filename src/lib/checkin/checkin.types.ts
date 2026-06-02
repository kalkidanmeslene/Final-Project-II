import type { EventStaffRole, ScanResult } from "@prisma/client";
import type { PurchasedTicketLine } from "./format-purchased-tickets";

export type ValidationState = ScanResult;

export type ScannedTicketInfo = {
  id: string;
  ticketCode: string;
  /** Ticket type on the QR code that was scanned. */
  ticketTypeName: string;
  holderName: string;
  checkedInAt: string | null;
  /** Full order from checkout (all types and quantities purchased). */
  purchasedTickets: PurchasedTicketLine[];
};

export type ScanResponse = {
  result: ValidationState;
  message: string;
  checkedIn: boolean;
  ticket?: ScannedTicketInfo;
};

export type ScanHistoryItem = {
  id: string;
  result: ScanResult;
  ticketCode: string | null;
  detail: string | null;
  scannedByName: string;
  createdAt: string;
  ticketTypeName: string | null;
  holderName: string | null;
  purchasedTickets: PurchasedTicketLine[];
};

export type CheckinAnalytics = {
  totalTickets: number;
  checkedIn: number;
  remaining: number;
  scanCounts: {
    valid: number;
    already_used: number;
    expired: number;
    invalid: number;
  };
  recentValid: {
    ticketCode: string;
    holderName: string;
    ticketTypeName: string;
    purchasedTickets: PurchasedTicketLine[];
    checkedInAt: string;
  }[];
};

export type EventStaffDto = {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  role: EventStaffRole;
  createdAt: string;
};

export type TicketQrDto = {
  ticketId: string;
  ticketCode: string;
  payload: string;
  expiresAt: string;
};
