"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import { Spinner } from "@/components/ui/spinner";

type NavRole = "attendee" | "organizer" | "admin";

const NAV: { href: string; label: string; roles?: NavRole[] }[] = [
  { href: "/profile/settings", label: "Account settings" },
  { href: "/profile/notifications", label: "Notifications" },
  { href: "/profile/attendee", label: "My profile", roles: ["attendee", "admin"] },
  { href: "/profile/organizer", label: "Organizer profile", roles: ["organizer", "admin"] },
  { href: "/profile/admin", label: "Admin profile", roles: ["admin"] },
];

export function ProfileShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, isLoading } = useProfile();

  const links = NAV.filter((item) => {
    if (!item.roles || !profile) return true;
    if (profile.role === "admin") return true;
    return item.roles.includes(profile.role);
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 bg-background px-4 py-10 sm:px-6">
      <header className="border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">Hibir Events</p>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {isLoading ? (
          <Spinner className="mt-2" />
        ) : (
          profile && (
            <p className="text-sm text-muted-foreground">
              {profile.fullName} · {profile.role}
            </p>
          )
        )}
      </header>

      <nav aria-label="Profile sections" className="flex flex-wrap gap-2">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href={
            profile
              ? `/dashboard/${profile.role === "admin" ? "admin" : profile.role === "organizer" ? "organizer" : "attendee"}`
              : "/"
          }
          className="rounded-full px-4 py-2 text-sm text-muted-foreground underline hover:text-foreground"
        >
          Back to dashboard
        </Link>
      </nav>

      <main>{children}</main>
    </div>
  );
}
