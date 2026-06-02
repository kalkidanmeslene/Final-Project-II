"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function PendingPage() {
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Approval pending</CardTitle>
          <CardDescription>
            Your organizer application is under review. You will be able to access the organizer dashboard once an
            admin approves your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/profile/settings" className="block">
            <Button variant="primary" className="w-full">
              Account settings
            </Button>
          </Link>
          <Button variant="danger" className="w-full" onClick={handleLogout}>
            Sign out
          </Button>
          <p className="text-center text-sm">
            <Link href="/" className="underline">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
