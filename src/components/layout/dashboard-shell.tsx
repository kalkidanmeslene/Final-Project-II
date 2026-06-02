"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function DashboardShell({
  title,
  children,
  hideTitle = false,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  hideTitle?: boolean;
  className?: string;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            {!hideTitle && title ? (
              <>
                <p className="text-sm text-muted-foreground">Hibir Events</p>
                <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
              </>
            ) : (
              <Link href="/" className="text-sm font-semibold text-foreground hover:text-primary">
                Hibir Events
              </Link>
            )}
            {user && (
              <p className="text-sm text-muted-foreground">
                {user.fullName} · {user.role}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile">
              <Button variant="outline" size="sm">
                Profile
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                Home
              </Button>
            </Link>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}