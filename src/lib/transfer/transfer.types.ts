export type TransferEligibility = {
  canTransfer: boolean;
  reason?: string;
};

export type TicketTransferDto = {
  id: string;
  ticketId: string;
  ticketCode: string;
  eventId: string;
  eventTitle: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  createdAt: string;
};

export type TransferTicketResult = {
  transfer: TicketTransferDto;
  ticket: {
    id: string;
    ticketCode: string;
    newOwnerId: string;
    qrVersion: number;
  };
};

export type BulkTransferTicketResult = {
  transferredCount: number;
  recipientName: string;
  recipientId: string;
  transfers: TransferTicketResult[];
  failures: { ticketId: string; ticketCode?: string; message: string }[];
};
