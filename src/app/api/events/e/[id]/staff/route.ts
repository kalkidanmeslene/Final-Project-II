import type { NextRequest } from "next/server";
import { handleAddStaff, handleListStaff } from "@/lib/checkin/checkin.controller";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleListStaff(req, id);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleAddStaff(req, id);
}
