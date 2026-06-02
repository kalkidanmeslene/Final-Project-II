import type { NextRequest } from "next/server";
import { handlePreviewCheckout } from "@/lib/booking/booking.controller";

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return handlePreviewCheckout(req, slug);
}
