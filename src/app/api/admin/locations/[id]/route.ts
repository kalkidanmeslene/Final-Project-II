import type { NextRequest } from "next/server";
import { handleAdminDeleteLocation, handleAdminUpdateLocation } from "@/lib/admin-dashboard/admin-dashboard.controller";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleAdminUpdateLocation(req, id);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleAdminDeleteLocation(_req, id);
}
