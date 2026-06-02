import { ZodError } from "zod";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import { getRequestMeta } from "@/lib/http/request-meta";
import { bulkTransferTicketsSchema, transferTicketSchema } from "./transfer.schemas";
import {
  getAdminTransferHistory,
  getMyTransferHistory,
  getTicketTransferEligibility,
  getTicketTransferHistory,
  transferTicket,
  transferTickets,
} from "./transfer.service";

function validationResponse(e: ZodError) {
  return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(e)), { status: 400 });
}

function unauthorized() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

export async function handleBulkTransferTickets(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const user = await requireCurrentUser();
    const body = bulkTransferTicketsSchema.parse(await req.json());
    const result = await transferTickets({
      ticketIds: body.ticketIds,
      fromUserId: user.id,
      recipientEmail: body.recipientEmail,
      recipientPhone: body.recipientPhone,
      ipAddress,
      userAgent,
    });

    if (!result.ok) {
      const status =
        result.code === "RECIPIENT_NOT_FOUND"
          ? 404
          : result.code === "RECIPIENT_INACTIVE" || result.code === "SELF_TRANSFER"
            ? 400
            : 400;
      return NextResponse.json(fail(result.code, result.message), { status });
    }

    return NextResponse.json(ok(result.data), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleTransferTicket(req: NextRequest, ticketId: string) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const user = await requireCurrentUser();
    const body = transferTicketSchema.parse(await req.json());
    const result = await transferTicket({
      ticketId,
      fromUserId: user.id,
      recipientEmail: body.recipientEmail,
      recipientPhone: body.recipientPhone,
      ipAddress,
      userAgent,
    });

    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "RECIPIENT_NOT_FOUND"
            ? 409
            : 400;
      return NextResponse.json(fail(result.code, result.message), { status });
    }

    return NextResponse.json(ok(result.data), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleTicketTransferEligibility(_req: NextRequest, ticketId: string) {
  try {
    const user = await requireCurrentUser();
    const result = await getTicketTransferEligibility(ticketId, user.id);
    if (!result.ok) {
      return NextResponse.json(fail("NOT_FOUND", "Ticket not found."), { status: 404 });
    }
    return NextResponse.json(ok({ eligibility: result.eligibility }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleTicketTransferHistory(_req: NextRequest, ticketId: string) {
  try {
    const user = await requireCurrentUser();
    const history = await getTicketTransferHistory(ticketId, user.id, user.role);
    if (!history) {
      return NextResponse.json(fail("FORBIDDEN", "Access denied."), { status: 403 });
    }
    return NextResponse.json(ok({ history }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleMyTransferHistory() {
  try {
    const user = await requireCurrentUser();
    const history = await getMyTransferHistory(user.id);
    return NextResponse.json(ok({ history }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminTransferHistory(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "admin") {
      return NextResponse.json(fail("FORBIDDEN", "Admin only."), { status: 403 });
    }
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? "50");
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const history = await getAdminTransferHistory({ limit: Math.min(100, limit), cursor });
    return NextResponse.json(ok({ history }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}
