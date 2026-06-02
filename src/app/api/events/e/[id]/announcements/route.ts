import type { NextRequest } from "next/server";
import { handleOrganizerAnnouncement } from "@/lib/notifications/notification.controller";

type Props = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Props) {
  const { id } = await params;
  return handleOrganizerAnnouncement(req, id);
}
