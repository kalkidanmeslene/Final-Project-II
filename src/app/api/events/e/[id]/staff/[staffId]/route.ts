import type { NextRequest } from "next/server";
import { handleRemoveStaff } from "@/lib/checkin/checkin.controller";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string; staffId: string }> }) {
  const { id, staffId } = await ctx.params;
  return handleRemoveStaff(req, id, staffId);
}
