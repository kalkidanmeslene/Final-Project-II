import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function LegalDocument({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-foreground">{title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        <article className="prose prose-neutral max-w-none space-y-6 text-foreground/90 dark:prose-invert">
          {children}
        </article>
        <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            Related:{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            {" · "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/refund-policy" className="text-primary hover:underline">
              Refund Policy
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}
