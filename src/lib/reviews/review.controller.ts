import { ZodError } from "zod";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCurrentUser, getCurrentUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import { getRequestMeta } from "@/lib/http/request-meta";
import { createReviewSchema, moderateReviewSchema, reviewListQuerySchema } from "./review.schemas";
import {
  adminModerateReview,
  getAdminReviewQueue,
  getEventReviewsForOrganizer,
  getOrganizerReviewAnalytics,
  getPublicEventReviews,
  getReviewEligibility,
  submitReview,
} from "./review.service";

function validationResponse(e: ZodError) {
  return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(e)), { status: 400 });
}

function unauthorized() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

export async function handleGetPublicReviews(req: NextRequest, slug: string) {
  try {
    const params = reviewListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const result = await getPublicEventReviews(slug, params.limit, params.offset);
    if (!result) {
      return NextResponse.json(fail("NOT_FOUND", "Event not found."), { status: 404 });
    }
    const res = NextResponse.json(ok(result), { status: 200 });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res;
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleGetReviewEligibility(slug: string) {
  try {
    const user = await requireCurrentUser();
    const eligibility = await getReviewEligibility(user.id, slug);
    return NextResponse.json(ok({ eligibility }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleSubmitReview(req: NextRequest, slug: string) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const user = await requireCurrentUser();
    const body = createReviewSchema.parse(await req.json());
    const result = await submitReview({
      userId: user.id,
      eventSlug: slug,
      rating: body.rating,
      comment: body.comment,
      ticketId: body.ticketId,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "NOT_ELIGIBLE" || result.code === "SPAM_DETECTED"
            ? 403
            : result.code === "RATE_LIMIT"
              ? 429
              : 400;
      return NextResponse.json(fail(result.code, result.message), { status });
    }

    return NextResponse.json(ok({ review: result.review }), { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleOrganizerReviews(req: NextRequest, eventId: string) {
  try {
    const user = await requireCurrentUser();
    const params = reviewListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const result = await getEventReviewsForOrganizer({
      eventId,
      userId: user.id,
      role: user.role,
      limit: params.limit,
      offset: params.offset,
      status: params.status,
    });

    if (!result.ok) {
      const status = result.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json(fail(result.code, "Not allowed."), { status });
    }

    return NextResponse.json(ok(result.result), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleOrganizerReviewAnalytics(eventId: string) {
  try {
    const user = await requireCurrentUser();
    const result = await getOrganizerReviewAnalytics({
      eventId,
      userId: user.id,
      role: user.role,
    });

    if (!result.ok) {
      const status = result.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json(fail(result.code, "Not allowed."), { status });
    }

    return NextResponse.json(ok(result.analytics), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminReviewQueue(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "admin") {
      return NextResponse.json(fail("FORBIDDEN", "Admin only."), { status: 403 });
    }
    const params = reviewListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const result = await getAdminReviewQueue(params.limit, params.offset);
    return NextResponse.json(ok(result), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleAdminModerateReview(req: NextRequest, reviewId: string) {
  try {
    const user = await requireCurrentUser();
    if (user.role !== "admin") {
      return NextResponse.json(fail("FORBIDDEN", "Admin only."), { status: 403 });
    }
    const body = moderateReviewSchema.parse(await req.json());
    const result = await adminModerateReview({
      reviewId,
      adminId: user.id,
      status: body.status,
      note: body.note,
    });

    if (!result.ok) {
      return NextResponse.json(fail("NOT_FOUND", "Review not found."), { status: 404 });
    }

    return NextResponse.json(ok({ review: result.review }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleGetReviewEligibilityPublic(slug: string) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(ok({ eligibility: { canReview: false, reason: "Sign in to leave a review." } }), {
      status: 200,
    });
  }
  const eligibility = await getReviewEligibility(user.id, slug);
  return NextResponse.json(ok({ eligibility }), { status: 200 });
}
