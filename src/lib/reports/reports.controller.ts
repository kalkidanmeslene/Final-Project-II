import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import { reportsExportSchema, reportsQuerySchema } from "./reports.schemas";
import { buildReportCsv, buildReportPdfHtml } from "./reports.export";
import { buildReportsDashboard } from "./reports.service";

function unauthorized() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

function forbidden() {
  return NextResponse.json(fail("FORBIDDEN", "Not allowed."), { status: 403 });
}

export async function handleAdminReports(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "admin") return forbidden();

    const parsed = reportsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid query.", zodFieldErrors(parsed.error)), {
        status: 400,
      });
    }

    const data = await buildReportsDashboard("admin", undefined, parsed.data);
    return NextResponse.json(ok(data), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "INVALID_RANGE") {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid date range."), { status: 400 });
    }
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleOrganizerReports(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "organizer" && user.role !== "admin") return forbidden();

    const parsed = reportsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid query.", zodFieldErrors(parsed.error)), {
        status: 400,
      });
    }

    const data = await buildReportsDashboard("organizer", user.id, parsed.data);
    return NextResponse.json(ok(data), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof Error && e.message === "INVALID_RANGE") {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid date range."), { status: 400 });
    }
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminReportsExport(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "admin") return forbidden();
    return exportResponse(req, "admin", undefined);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleOrganizerReportsExport(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "organizer" && user.role !== "admin") return forbidden();
    return exportResponse(req, "organizer", user.id);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

async function exportResponse(req: NextRequest, scope: "admin" | "organizer", organizerId?: string) {
  const parsed = reportsExportSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "Invalid query.", zodFieldErrors(parsed.error)), {
      status: 400,
    });
  }

  const data = await buildReportsDashboard(scope, organizerId, parsed.data);
  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = `hibir-${scope}-${parsed.data.type}-${stamp}`;

  if (parsed.data.format === "pdf") {
    const html = buildReportPdfHtml(data, parsed.data.type);
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.html"`,
      },
    });
  }

  const csv = buildReportCsv(data, parsed.data.type);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.csv"`,
    },
  });
}
