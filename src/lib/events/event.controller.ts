import { ZodError } from "zod";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser, requireCurrentUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import {
  adminApproveEvent,
  adminRejectEvent,
  cancelEvent,
  createOrganizerEvent,
  deleteGalleryMedia,
  deleteOrganizerEvent,
  getCategories,
  getEventAvailability,
  getEventBySlug,
  getOrganizerEvents,
  getPendingEventsForAdmin,
  getPublicEvents,
  postponeEvent,
  submitEventForApproval,
  updateOrganizerEvent,
  uploadEventBanner,
  uploadGalleryMedia,
} from "./event.service";
import {
  adminReviewSchema,
  cancelEventSchema,
  createEventSchema,
  draftCreateEventSchema,
  draftUpdateEventSchema,
  postponeEventSchema,
  updateEventSchema,
} from "./event.schemas";

function validationResponse(e: ZodError) {
  return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(e)), { status: 400 });
}

function unauthorized() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

function forbidden(message = "Forbidden.") {
  return NextResponse.json(fail("FORBIDDEN", message), { status: 403 });
}

function serviceError(result: {
  ok: false;
  code: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}) {
  const statusMap: Record<string, number> = {
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    TICKETS_SOLD: 409,
    SCHEDULE_LOCKED: 409,
    CAPACITY_TOO_LOW: 400,
    INVALID_STATUS: 400,
    INVALID_DATE: 400,
    INCOMPLETE_DRAFT: 400,
    NO_CATEGORIES: 503,
    SLUG_CONFLICT: 409,
  };
  return NextResponse.json(
    fail(result.code, result.message ?? "Request failed.", result.fieldErrors),
    { status: statusMap[result.code] ?? 400 },
  );
}

async function requireOrganizer() {
  const user = await requireCurrentUser();
  if (user.role !== "organizer" && user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  if (user.role === "organizer" && user.status === "pending") {
    throw new Error("ORGANIZER_PENDING");
  }
  return user;
}

export async function handleListCategories() {
  const categories = await getCategories();
  return NextResponse.json(ok({ categories }), { status: 200 });
}

export async function handleListPublicEvents(req: NextRequest) {
  const { handleSearchEvents } = await import("@/lib/discovery/discovery.controller");
  return handleSearchEvents(req);
}

export async function handleGetEventBySlug(req: NextRequest, slug: string) {
  const viewer = await getCurrentUser();
  const event = await getEventBySlug(slug, viewer ? { userId: viewer.id, role: viewer.role } : undefined);
  if (!event) {
    return NextResponse.json(fail("NOT_FOUND", "Event not found."), { status: 404 });
  }
  return NextResponse.json(ok({ event }), { status: 200 });
}

export async function handleGetAvailability(_req: NextRequest, slug: string) {
  const availability = await getEventAvailability(slug);
  if (!availability) {
    return NextResponse.json(fail("NOT_FOUND", "Event not found."), { status: 404 });
  }
  return NextResponse.json(ok({ availability }), { status: 200 });
}

export async function handleCreateEvent(req: NextRequest) {
  try {
    const user = await requireOrganizer();
    const body = await req.json();
    const saveAsDraft = body?.saveAsDraft === true;
    const parsed = saveAsDraft ? draftCreateEventSchema.parse(body) : createEventSchema.parse(body);
    const result = await createOrganizerEvent({
      organizerId: user.id,
      title: parsed.title,
      description: parsed.description,
      categoryId: parsed.categoryId,
      location: parsed.location,
      venue: parsed.venue,
      eventDate: parsed.eventDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      ticketPrice: parsed.ticketPrice,
      capacity: parsed.capacity,
      visibility: parsed.visibility,
      transferEnabled: parsed.transferEnabled,
      saveAsDraft,
    });
    if (!result.ok) return serviceError(result);
    return NextResponse.json(ok({ event: result.event }), { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden("Only organizers can create events.");
    if (e instanceof Error && e.message === "ORGANIZER_PENDING") {
      return forbidden("Organizer account must be approved first.");
    }
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleUpdateEvent(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const body = await req.json();
    const parsed =
      body?.saveAsDraft === true ? draftUpdateEventSchema.parse(body) : updateEventSchema.parse(body);
    const { saveAsDraft: _draft, ...updates } = parsed as typeof parsed & { saveAsDraft?: boolean };
    const result = await updateOrganizerEvent({
      eventId,
      userId: user.id,
      role: user.role,
      updates,
    });
    if (!result.ok) return serviceError(result);
    return NextResponse.json(ok({ event: result.event }), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handlePostponeEvent(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const parsed = postponeEventSchema.parse(await req.json());
    const result = await postponeEvent({
      eventId,
      userId: user.id,
      role: user.role,
      eventDate: parsed.eventDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      reason: parsed.reason,
    });
    if (!result.ok) return serviceError(result);
    return NextResponse.json(ok({ event: result.event }), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleDeleteEvent(_req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const result = await deleteOrganizerEvent({ eventId, userId: user.id, role: user.role });
    if (!result.ok) return serviceError(result);
    return NextResponse.json(ok({}), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleSubmitEvent(_req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const result = await submitEventForApproval({ eventId, userId: user.id, role: user.role });
    if (!result.ok) return serviceError(result);
    return NextResponse.json(ok({ event: result.event }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleCancelEvent(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const body = await req.json().catch(() => ({}));
    const parsed = cancelEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input."), {
        status: 400,
      });
    }
    const result = await cancelEvent({
      eventId,
      userId: user.id,
      role: user.role,
      reason: parsed.data.reason,
    });
    if (!result.ok) return serviceError(result);
    return NextResponse.json(ok({ event: result.event }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleOrganizerEvents() {
  try {
    const user = await requireOrganizer();
    const events = await getOrganizerEvents(user.id);
    return NextResponse.json(ok({ events }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleUploadBanner(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const formData = await req.formData();
    const file = formData.get("banner");
    if (!(file instanceof File)) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Banner file is required."), { status: 400 });
    }
    const result = await uploadEventBanner({ eventId, userId: user.id, role: user.role, file });
    if (!result.ok) return serviceError(result);
    return NextResponse.json(ok({ event: result.event }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error) {
      return NextResponse.json(fail("VALIDATION_ERROR", e.message), { status: 400 });
    }
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleUploadGallery(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const formData = await req.formData();
    const file = formData.get("media");
    if (!(file instanceof File)) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Media file is required."), { status: 400 });
    }
    const sortOrder = formData.get("sortOrder");
    const result = await uploadGalleryMedia({
      eventId,
      userId: user.id,
      role: user.role,
      file,
      sortOrder: sortOrder ? Number(sortOrder) : undefined,
    });
    if (!result.ok) return serviceError(result);
    return NextResponse.json(ok({ event: result.event }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error) {
      return NextResponse.json(fail("VALIDATION_ERROR", e.message), { status: 400 });
    }
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleDeleteGallery(req: NextRequest, eventId: string, mediaId: string) {
  try {
    const user = await requireCurrentUser();
    const result = await deleteGalleryMedia({ eventId, mediaId, userId: user.id, role: user.role });
    if (!result.ok) return serviceError(result);
    return NextResponse.json(ok({ event: result.event }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminPending() {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "admin") return forbidden();
    const events = await getPendingEventsForAdmin();
    return NextResponse.json(ok({ events }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminApprove(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "admin") return forbidden();
    const body = adminReviewSchema.parse(await req.json().catch(() => ({})));
    const result = await adminApproveEvent({ eventId, adminId: user.id, note: body.note });
    if (!result.ok) return serviceError(result);
    return NextResponse.json(ok({ event: result.event }), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminReject(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "admin") return forbidden();
    const body = adminReviewSchema.parse(await req.json().catch(() => ({})));
    const result = await adminRejectEvent({ eventId, adminId: user.id, note: body.note });
    if (!result.ok) return serviceError(result);
    return NextResponse.json(ok({ event: result.event }), { status: 200 });
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}
