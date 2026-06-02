import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ProfileIndexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  switch (user.role) {
    case "admin":
      redirect("/profile/admin");
    case "organizer":
      redirect("/profile/organizer");
    default:
      redirect("/profile/attendee");
  }
}
