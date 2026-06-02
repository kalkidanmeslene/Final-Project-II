import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import {
  adminAuditListSchema,
  adminUserListSchema,
  categorySchema,
  locationSchema,
  moderationNoteSchema,
  settingsSchema,
} from "./admin-dashboard.schemas";
import {
  approveEventAdmin,
  approveOrganizerAdmin,
  buildAdminDashboard,
  createCategoryAdmin,
  createLocationAdmin,
  deleteCategoryAdmin,
  deleteLocationAdmin,
  getCategoriesAdmin,
  getLocationsAdmin,
  getPlatformSettings,
  listAdminAuditLogs,
  listAdminUsers,
  listOrganizerApplications,
  listPendingEventsAdmin,
  rejectEventAdmin,
  rejectOrganizerAdmin,
  savePlatformSettings,
  suspendUserAdmin,
  unsuspendUserAdmin,
  updateCategoryAdmin,
  updateLocationAdmin,
} from "./admin-dashboard.service";

function unauthorized() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

function forbidden() {
  return NextResponse.json(fail("FORBIDDEN", "Admin access required."), { status: 403 });
}

async function requireAdmin() {
  const user = await requireCurrentUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

export async function handleAdminDashboard() {
  try {
    await requireAdmin();
    const data = await buildAdminDashboard();
    return NextResponse.json(ok(data), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminUsers(req: NextRequest) {
  try {
    await requireAdmin();
    const parsed = adminUserListSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid query.", zodFieldErrors(parsed.error)), {
        status: 400,
      });
    }
    const data = await listAdminUsers(parsed.data);
    return NextResponse.json(ok(data), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminAuditLogs(req: NextRequest) {
  try {
    await requireAdmin();
    const parsed = adminAuditListSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid query.", zodFieldErrors(parsed.error)), {
        status: 400,
      });
    }
    const data = await listAdminAuditLogs(parsed.data);
    return NextResponse.json(ok(data), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminOrganizerApplications() {
  try {
    await requireAdmin();
    const applications = await listOrganizerApplications();
    return NextResponse.json(ok({ applications }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminPendingEvents() {
  try {
    await requireAdmin();
    const events = await listPendingEventsAdmin();
    return NextResponse.json(ok({ events }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminApproveOrganizerApp(req: NextRequest, userId: string) {
  try {
    const admin = await requireAdmin();
    const body = moderationNoteSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }
    await approveOrganizerAdmin(admin.id, userId, body.data.note);
    return NextResponse.json(ok({ userId }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminRejectOrganizerApp(req: NextRequest, userId: string) {
  try {
    const admin = await requireAdmin();
    const body = moderationNoteSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }
    await rejectOrganizerAdmin(admin.id, userId, body.data.note);
    return NextResponse.json(ok({ userId }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminApproveEvent(req: NextRequest, eventId: string) {
  try {
    const admin = await requireAdmin();
    const body = moderationNoteSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }
    const result = await approveEventAdmin(admin.id, eventId, body.data.note);
    if (!result.ok) {
      return NextResponse.json(fail(result.code, "Cannot approve this event."), { status: 400 });
    }
    return NextResponse.json(ok({ event: result.event }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminRejectEvent(req: NextRequest, eventId: string) {
  try {
    const admin = await requireAdmin();
    const body = moderationNoteSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }
    const result = await rejectEventAdmin(admin.id, eventId, body.data.note);
    if (!result.ok) {
      return NextResponse.json(fail(result.code, "Cannot reject this event."), { status: 400 });
    }
    return NextResponse.json(ok({ event: result.event }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminSuspendUser(_req: NextRequest, userId: string) {
  try {
    const admin = await requireAdmin();
    const result = await suspendUserAdmin(admin.id, userId);
    if (!result.ok) {
      const status = result.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json(fail(result.code, result.message ?? "Action not allowed."), { status });
    }
    return NextResponse.json(ok({ userId }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminUnsuspendUser(_req: NextRequest, userId: string) {
  try {
    const admin = await requireAdmin();
    const result = await unsuspendUserAdmin(admin.id, userId);
    if (!result.ok) {
      return NextResponse.json(fail(result.code, "User not found."), { status: 404 });
    }
    return NextResponse.json(ok({ userId }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminCategories() {
  try {
    await requireAdmin();
    const categories = await getCategoriesAdmin();
    return NextResponse.json(ok({ categories }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminCreateCategory(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = categorySchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }
    const result = await createCategoryAdmin(admin.id, body.data);
    if (!result.ok) {
      return NextResponse.json(fail(result.code, result.message), { status: 409 });
    }
    return NextResponse.json(ok({ category: result.category }), { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminUpdateCategory(req: NextRequest, id: string) {
  try {
    const admin = await requireAdmin();
    const body = categorySchema.partial().safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }
    const category = await updateCategoryAdmin(admin.id, id, body.data);
    return NextResponse.json(ok({ category }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminDeleteCategory(_req: NextRequest, id: string) {
  try {
    const admin = await requireAdmin();
    await deleteCategoryAdmin(admin.id, id);
    return NextResponse.json(ok({ id }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminLocations() {
  try {
    await requireAdmin();
    const locations = await getLocationsAdmin();
    return NextResponse.json(ok({ locations }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminCreateLocation(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = locationSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }
    const location = await createLocationAdmin(admin.id, body.data);
    return NextResponse.json(ok({ location }), { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminUpdateLocation(req: NextRequest, id: string) {
  try {
    const admin = await requireAdmin();
    const body = locationSchema.partial().safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }
    const location = await updateLocationAdmin(admin.id, id, body.data);
    return NextResponse.json(ok({ location }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminDeleteLocation(_req: NextRequest, id: string) {
  try {
    const admin = await requireAdmin();
    await deleteLocationAdmin(admin.id, id);
    return NextResponse.json(ok({ id }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminSettings() {
  try {
    await requireAdmin();
    const settings = await getPlatformSettings();
    return NextResponse.json(ok({ settings }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminUpdateSettings(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = settingsSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }
    const settings = await savePlatformSettings(admin.id, body.data);
    return NextResponse.json(ok({ settings }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "FORBIDDEN") return forbidden();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}
