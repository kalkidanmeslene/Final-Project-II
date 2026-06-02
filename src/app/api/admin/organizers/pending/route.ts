import { handleAdminPendingOrganizers } from "@/lib/auth/auth.controller";

export async function GET() {
  return handleAdminPendingOrganizers();
}
