import type { NextRequest } from "next/server";
import { handleEventAttendees } from "@/lib/organizer-dashboard/organizer-dashboard.controller";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  const { id } = await params;
  return handleEventAttendees(req, id);
}
