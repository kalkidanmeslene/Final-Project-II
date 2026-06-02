import { randomBytes } from "crypto";

export function generateTicketCode(): string {
  const part = randomBytes(4).toString("hex").toUpperCase();
  return `HIBIR-${part}`;
}

export function generatePaymentReference(): string {
  const part = randomBytes(6).toString("hex").toUpperCase();
  return `PAY-${part}`;
}
