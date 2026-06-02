"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";

const NOTICES: Record<string, string> = {
  draft: "Event saved as draft. Add media and details below, then submit for approval when ready.",
  submitted: "Event submitted for approval. An admin will review it soon.",
  saved: "Changes saved.",
};

export function EditEventNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const notice = searchParams.get("notice");
    if (!notice || !NOTICES[notice]) return;

    setMessage(NOTICES[notice]);
    router.replace(pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 8000);
    return () => window.clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <Alert variant="success" role="status" className="mb-6 flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      {message}
    </Alert>
  );
}
