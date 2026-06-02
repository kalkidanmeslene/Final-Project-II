import QRCode from "qrcode";
import { checkinWindowEnd, signTicketQrToken } from "@/lib/checkin/qr-token";

export type TicketEmailQrAttachment = {
  ticketId: string;
  ticketCode: string;
  ticketTypeName: string;
  cid: string;
  buffer: Buffer;
};

export async function buildTicketQrAttachments(
  tickets: {
    id: string;
    ticketCode: string;
    ticketTypeName: string;
    eventId: string;
    eventEndsAt: Date;
    qrVersion: number;
  }[],
): Promise<TicketEmailQrAttachment[]> {
  const results: TicketEmailQrAttachment[] = [];

  for (const ticket of tickets) {
    const expiresAt = checkinWindowEnd(ticket.eventEndsAt);
    const payload = await signTicketQrToken(
      {
        ticketId: ticket.id,
        ticketCode: ticket.ticketCode,
        eventId: ticket.eventId,
        version: ticket.qrVersion,
      },
      expiresAt,
    );

    const buffer = await QRCode.toBuffer(payload, {
      type: "png",
      width: 220,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    results.push({
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      ticketTypeName: ticket.ticketTypeName,
      cid: `ticket-qr-${ticket.id}`,
      buffer,
    });
  }

  return results;
}
