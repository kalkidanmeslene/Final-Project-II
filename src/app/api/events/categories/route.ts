import { handleListCategories } from "@/lib/events/event.controller";

export async function GET() {
  return handleListCategories();
}
