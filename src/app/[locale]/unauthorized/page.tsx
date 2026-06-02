import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ suspended?: string }>;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <UnauthorizedContent searchParams={searchParams} />
    </div>
  );
}

async function UnauthorizedContent({ searchParams }: { searchParams: Promise<{ suspended?: string }> }) {
  const params = await searchParams;
  const suspended = params.suspended === "1";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{suspended ? "Account suspended" : "Unauthorized"}</CardTitle>
        <CardDescription>
          {suspended
            ? "Your account has been suspended. Contact support for assistance."
            : "You do not have permission to view this page."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/login" className="text-sm underline">
          Return to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
