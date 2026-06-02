import { NextResponse } from "next/server";
import { ok } from "@/lib/http/api-response";
import { getCachedDiscoverHome } from "@/lib/discovery/discovery.cache";

export async function GET() {
  const data = await getCachedDiscoverHome();
  const res = NextResponse.json(ok(data), { status: 200 });
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return res;
}
