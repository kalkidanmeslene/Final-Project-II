import type { NextRequest } from "next/server";
import { handleMarkRead } from "@/lib/notifications/notification.controller";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  return handleMarkRead(id);
}
