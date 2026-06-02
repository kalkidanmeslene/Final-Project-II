import { ZodError } from "zod";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import { eventSearchQuerySchema, parseDateParam } from "./discovery.schemas";
import { getFeaturedEvents, getTrendingEvents, searchEvents } from "./discovery.service";

function validationResponse(e: ZodError) {
  return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(e)), { status: 400 });
}

export async function handleSearchEvents(req: NextRequest) {
  try {
    const params = eventSearchQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const result = await searchEvents({
      q: params.q,
      categorySlug: params.category,
      dateFrom: parseDateParam(params.dateFrom),
      dateTo: parseDateParam(params.dateTo),
      priceMin: params.priceMin,
      priceMax: params.priceMax,
      freeOnly: params.free,
      sort: params.sort,
      limit: params.limit,
      offset: params.offset,
    });

    const res = NextResponse.json(ok(result), { status: 200 });
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return res;
  } catch (e) {
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleFeaturedEvents(req: NextRequest) {
  const limit = Math.min(12, Number(req.nextUrl.searchParams.get("limit") ?? 6));
  const events = await getFeaturedEvents(limit);
  const res = NextResponse.json(ok({ events }), { status: 200 });
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return res;
}

export async function handleTrendingEvents(req: NextRequest) {
  const limit = Math.min(12, Number(req.nextUrl.searchParams.get("limit") ?? 8));
  const events = await getTrendingEvents(limit);
  const res = NextResponse.json(ok({ events }), { status: 200 });
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return res;
}
