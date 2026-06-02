import { handleMe } from "@/lib/auth/auth.controller";

export async function GET() {
  return handleMe();
}
