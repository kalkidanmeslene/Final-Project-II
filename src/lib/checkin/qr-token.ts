import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();
const QR_PREFIX = "hibir:v1:";
const QR_AUDIENCE = "hibir-events:ticket-qr";
const QR_ISSUER = "hibir-events";

export type TicketQrClaims = {
  ticketId: string;
  ticketCode: string;
  eventId: string;
  version: number;
};

function getQrSecret(): Uint8Array {
  const secret = process.env.TICKET_QR_SECRET ?? process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("TICKET_QR_SECRET_NOT_CONFIGURED");
  }
  return encoder.encode(secret);
}

export function wrapQrPayload(token: string): string {
  return `${QR_PREFIX}${token}`;
}

export function unwrapQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith(QR_PREFIX)) {
    return trimmed.slice(QR_PREFIX.length);
  }
  if (trimmed.includes(".")) {
    return trimmed;
  }
  return null;
}

export async function signTicketQrToken(claims: TicketQrClaims, expiresAt: Date): Promise<string> {
  const token = await new SignJWT({
    jti: claims.ticketCode,
    eid: claims.eventId,
    ver: claims.version,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.ticketId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuer(process.env.AUTH_JWT_ISSUER ?? QR_ISSUER)
    .setAudience(QR_AUDIENCE)
    .sign(getQrSecret());

  return wrapQrPayload(token);
}

export async function verifyTicketQrToken(raw: string): Promise<
  | { ok: true; claims: TicketQrClaims }
  | { ok: false; reason: "malformed" | "invalid_signature" | "expired" }
> {
  const token = unwrapQrPayload(raw);
  if (!token) return { ok: false, reason: "malformed" };

  try {
    const { payload } = await jwtVerify(token, getQrSecret(), {
      issuer: process.env.AUTH_JWT_ISSUER ?? QR_ISSUER,
      audience: QR_AUDIENCE,
    });

    if (typeof payload.sub !== "string") return { ok: false, reason: "malformed" };
    if (typeof payload.jti !== "string") return { ok: false, reason: "malformed" };
    if (typeof payload.eid !== "string") return { ok: false, reason: "malformed" };
    const ver = typeof payload.ver === "number" ? payload.ver : Number(payload.ver);
    if (!Number.isFinite(ver)) return { ok: false, reason: "malformed" };

    return {
      ok: true,
      claims: {
        ticketId: payload.sub,
        ticketCode: payload.jti,
        eventId: payload.eid,
        version: ver,
      },
    };
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "ERR_JWT_EXPIRED") return { ok: false, reason: "expired" };
    return { ok: false, reason: "invalid_signature" };
  }
}

/** Check-in allowed until event end + grace hours */
export const CHECKIN_GRACE_HOURS = 12;

export function checkinWindowEnd(endsAt: Date): Date {
  return new Date(endsAt.getTime() + CHECKIN_GRACE_HOURS * 60 * 60 * 1000);
}

export function isCheckinWindowOpen(endsAt: Date, now = new Date()): boolean {
  return now <= checkinWindowEnd(endsAt);
}
