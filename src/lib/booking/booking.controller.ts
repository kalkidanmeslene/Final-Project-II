import { ZodError } from "zod";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import {
  completeCheckout,
  getBookingDetail,
  getBookingHistory,
  getMyTickets,
  getTicketTypesForEvent,
  previewCheckout,
  validateTicketOwnership,
} from "./booking.service";
import { checkoutPreviewSchema, completeCheckoutSchema } from "./booking.schemas";

function validationResponse(e: ZodError) {
  return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(e)), { status: 400 });
}

function unauthorized() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

function bookingError(result: { ok: false; code: string; message: string }) {
  const status =
    result.code === "INSUFFICIENT_CAPACITY"
      ? 409
      : result.code === "EVENT_NOT_FOUND" || result.code === "NOT_FOUND"
        ? 404
        : 400;
  return NextResponse.json(fail(result.code, result.message), { status });
}

export async function handleGetTicketTypes(_req: NextRequest, slug: string) {
  const data = await getTicketTypesForEvent(slug);
  if (!data) {
    return NextResponse.json(fail("NOT_FOUND", "Event not found."), { status: 404 });
  }
  return NextResponse.json(ok(data), { status: 200 });
}

export async function handlePreviewCheckout(req: NextRequest, slug: string) {
  try {
    const body = checkoutPreviewSchema.parse(await req.json());
    const result = await previewCheckout({
      eventSlug: slug,
      lines: body.lines,
    });
    if (!result.ok) return bookingError(result);
    return NextResponse.json(ok({ summary: result.summary }), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleCompleteCheckout(req: NextRequest, slug: string) {
  try {
    const user = await requireCurrentUser();
    const body = completeCheckoutSchema.parse(await req.json());
    const result = await completeCheckout({
      userId: user.id,
      eventSlug: slug,
      lines: body.lines,
      paymentResult: body.paymentResult,
    });
    if (!result.ok) return bookingError(result);
    return NextResponse.json(
      ok({ paymentStatus: result.paymentStatus, booking: result.booking }),
      { status: result.paymentStatus === "successful" ? 201 : 200 },
    );
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleBookingHistory() {
  try {
    const user = await requireCurrentUser();
    const bookings = await getBookingHistory(user.id);
    return NextResponse.json(ok({ bookings }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleMyTickets() {
  try {
    const user = await requireCurrentUser();
    const tickets = await getMyTickets(user.id);
    return NextResponse.json(ok({ tickets }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleBookingDetail(_req: NextRequest, bookingId: string) {
  try {
    const user = await requireCurrentUser();
    const booking = await getBookingDetail(user.id, bookingId);
    if (!booking) {
      return NextResponse.json(fail("NOT_FOUND", "Booking not found."), { status: 404 });
    }
    return NextResponse.json(ok({ booking }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleValidateTicket(_req: NextRequest, ticketCode: string) {
  try {
    const user = await requireCurrentUser();
    const result = await validateTicketOwnership(ticketCode, user.id);
    if (!result.ok) {
      return NextResponse.json(fail(result.code, "Ticket validation failed."), { status: 403 });
    }
    return NextResponse.json(ok({ ticket: result.ticket }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}
