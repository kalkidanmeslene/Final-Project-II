import { ZodError } from "zod";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import {
  assignStaff,
  getEventCheckinAnalytics,
  getScanHistory,
  getStaffList,
  getTicketQrPayload,
  processScan,
  unassignStaff,
} from "./checkin.service";
import { addStaffSchema, scanHistoryQuerySchema, scanPayloadSchema } from "./checkin.schemas";

function validationResponse(e: ZodError) {
  return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(e)), { status: 400 });
}

function unauthorized() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

function clientIp(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip");
}

export async function handleTicketQr(_req: NextRequest, ticketId: string) {
  try {
    const user = await requireCurrentUser();
    const qr = await getTicketQrPayload(ticketId, user.id);
    if (!qr) {
      return NextResponse.json(fail("NOT_FOUND", "Ticket not found."), { status: 404 });
    }
    return NextResponse.json(ok({ qr }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "TICKET_QR_SECRET_NOT_CONFIGURED") {
      return NextResponse.json(fail("CONFIG_ERROR", "QR signing is not configured."), { status: 500 });
    }
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleScan(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const body = scanPayloadSchema.parse(await req.json());
    const result = await processScan({
      eventId,
      payload: body.payload,
      scannerUserId: user.id,
      scannerRole: user.role,
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });
    if (!result.ok) {
      const status = result.code === "FORBIDDEN" ? 403 : 404;
      return NextResponse.json(fail(result.code, result.message), { status });
    }
    return NextResponse.json(ok({ scan: result.response }), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleScanHistory(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const query = scanHistoryQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const history = await getScanHistory(eventId, user.id, user.role, query);
    if (!history) {
      return NextResponse.json(fail("FORBIDDEN", "Check-in access denied."), { status: 403 });
    }
    return NextResponse.json(ok({ history }), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleCheckinAnalytics(_req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const analytics = await getEventCheckinAnalytics(eventId, user.id, user.role);
    if (!analytics) {
      return NextResponse.json(fail("FORBIDDEN", "Check-in access denied."), { status: 403 });
    }
    return NextResponse.json(ok({ analytics }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleListStaff(_req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const staff = await getStaffList(eventId, user.id, user.role);
    if (!staff) {
      return NextResponse.json(fail("FORBIDDEN", "Staff management denied."), { status: 403 });
    }
    return NextResponse.json(ok({ staff }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAddStaff(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const body = addStaffSchema.parse(await req.json());
    const result = await assignStaff({
      eventId,
      managerUserId: user.id,
      managerRole: user.role,
      email: body.email,
      role: body.role,
    });
    if (!result.ok) {
      const status =
        result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json(fail(result.code, result.message), { status });
    }
    return NextResponse.json(ok({ staff: result.staff }), { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleRemoveStaff(_req: NextRequest, eventId: string, staffId: string) {
  try {
    const user = await requireCurrentUser();
    const result = await unassignStaff({
      eventId,
      staffId,
      managerUserId: user.id,
      managerRole: user.role,
    });
    if (!result.ok) {
      const status = result.code === "FORBIDDEN" ? 403 : 404;
      return NextResponse.json(fail(result.code!, result.message!), { status });
    }
    return NextResponse.json(ok({ removed: true }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}
