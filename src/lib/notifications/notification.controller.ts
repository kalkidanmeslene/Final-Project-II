import { ZodError } from "zod";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import {
  notificationListQuerySchema,
  notificationPreferencesSchema,
  organizerAnnouncementSchema,
} from "./notification.schemas";
import {
  getPreferences,
  getUnreadCount,
  listUserNotifications,
  markAllRead,
  markRead,
  processDueScheduledNotifications,
  savePreferences,
  sendOrganizerAnnouncement,
} from "./notification.service";

function validationResponse(e: ZodError) {
  return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(e)), { status: 400 });
}

function unauthorized() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

function verifyCronSecret(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (env.CRON_SECRET) return secret === env.CRON_SECRET;
  return process.env.NODE_ENV !== "production";
}

export async function handleListNotifications(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const params = notificationListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const result = await listUserNotifications({
      userId: user.id,
      limit: params.limit,
      offset: params.offset,
      unreadOnly: params.unreadOnly,
    });
    return NextResponse.json(ok(result), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleUnreadCount() {
  try {
    const user = await requireCurrentUser();
    const result = await getUnreadCount(user.id);
    return NextResponse.json(ok(result), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleMarkRead(notificationId: string) {
  try {
    const user = await requireCurrentUser();
    const result = await markRead(user.id, notificationId);
    if (!result.ok) {
      return NextResponse.json(fail("NOT_FOUND", "Notification not found."), { status: 404 });
    }
    return NextResponse.json(ok({ read: true }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleMarkAllRead() {
  try {
    const user = await requireCurrentUser();
    const result = await markAllRead(user.id);
    return NextResponse.json(ok(result), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleGetPreferences() {
  try {
    const user = await requireCurrentUser();
    const preferences = await getPreferences(user.id);
    return NextResponse.json(ok({ preferences }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleUpdatePreferences(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = notificationPreferencesSchema.parse(await req.json());
    const preferences = await savePreferences(user.id, body);
    return NextResponse.json(ok({ preferences }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleProcessScheduledNotifications(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json(fail("FORBIDDEN", "Invalid cron secret."), { status: 403 });
  }
  const result = await processDueScheduledNotifications();
  return NextResponse.json(ok(result), { status: 200 });
}

export async function handleOrganizerAnnouncement(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "organizer" && user.role !== "admin") {
      return NextResponse.json(fail("FORBIDDEN", "Not allowed."), { status: 403 });
    }
    const body = organizerAnnouncementSchema.parse(await req.json());
    const result = await sendOrganizerAnnouncement({
      eventId,
      organizerId: user.id,
      role: user.role,
      title: body.title,
      message: body.message,
    });

    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND" ? 404 : result.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        fail(result.code, "message" in result && result.message ? result.message : "Unable to send announcement."),
        { status },
      );
    }

    return NextResponse.json(ok({ recipientCount: result.recipients.length }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}
