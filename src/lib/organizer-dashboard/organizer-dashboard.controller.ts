import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http/api-response";
import { buildOrganizerDashboard, getEventAttendeesForOrganizer } from "./organizer-dashboard.service";

function unauthorized() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

function forbidden() {
  return NextResponse.json(fail("FORBIDDEN", "Organizer access required."), { status: 403 });
}

export async function handleOrganizerDashboard() {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "organizer" && user.role !== "admin") return forbidden();
    const data = await buildOrganizerDashboard(user.id);
    return NextResponse.json(ok(data), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleEventAttendees(_req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "organizer" && user.role !== "admin") return forbidden();
    const result = await getEventAttendeesForOrganizer({
      eventId,
      userId: user.id,
      role: user.role,
    });
    if (!result.ok) {
      const status = result.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json(fail(result.code, "Not allowed."), { status });
    }
    return NextResponse.json(ok({ attendees: result.attendees }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}
