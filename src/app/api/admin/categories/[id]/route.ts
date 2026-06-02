import type { NextRequest } from "next/server";
import { handleAdminDeleteCategory, handleAdminUpdateCategory } from "@/lib/admin-dashboard/admin-dashboard.controller";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleAdminUpdateCategory(req, id);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleAdminDeleteCategory(_req, id);
}
