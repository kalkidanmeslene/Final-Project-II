"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitOrganizerApplicationAction, type AuthActionState } from "@/actions/auth.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const initial: AuthActionState = { ok: true };

const textareaClass =
  "min-h-20 w-full rounded-lg border border-input bg-input-background px-4 py-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none";

export default function BecomeOrganizerPage() {
  const [state, action, pending] = useActionState(submitOrganizerApplicationAction, initial);

  return (
    <DashboardShell title="Organizer application">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Apply to host events</h2>
          <p className="mt-2 text-muted-foreground">
            Tell us a bit about you or your brand. An admin will review your application. You can
            also{" "}
            <Link href="/signup/organizer" className="font-semibold text-primary hover:underline">
              register a new organizer account
            </Link>{" "}
            instead of upgrading from attendee.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8">
          {!state.ok && state.message && (
            <Alert variant="destructive" className="mb-4">
              {state.message}
            </Alert>
          )}

          <form action={action} className="space-y-5">
            <Input
              id="displayName"
              name="displayName"
              required
              label="Display / brand name"
              placeholder="e.g. Addis Live Events or your name"
              error={state.fieldErrors?.displayName?.[0]}
            />

            <Input
              id="portfolioUrl"
              name="portfolioUrl"
              type="url"
              label="Portfolio or social link (optional)"
              placeholder="https://instagram.com/you"
              error={state.fieldErrors?.portfolioUrl?.[0]}
            />
            <p className="-mt-3 text-xs text-muted-foreground">
              Website, Instagram, Linktree, or similar — not required.
            </p>

            <Input id="city" name="city" label="City / location (optional)" placeholder="e.g. Addis Ababa" />

            <Input
              id="contactPhone"
              name="contactPhone"
              label="Contact phone (optional)"
              placeholder="+251..."
              error={state.fieldErrors?.contactPhone?.[0]}
            />

            <div className="space-y-2">
              <label htmlFor="about" className="block text-sm font-semibold text-foreground">
                About you (optional)
              </label>
              <textarea
                id="about"
                name="about"
                className={textareaClass}
                placeholder="What kinds of events do you plan to host?"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="referenceLinks" className="block text-sm font-semibold text-foreground">
                Reference links (optional, one per line)
              </label>
              <textarea
                id="referenceLinks"
                name="referenceLinks"
                className={textareaClass}
                placeholder="Past event pages, social profiles, press links..."
              />
              <p className="text-xs text-muted-foreground">
                Optional URLs that help admins verify you. Not a file upload — paste links only.
              </p>
            </div>

            <Button type="submit" size="lg" disabled={pending} className={cn(pending && "opacity-70")}>
              {pending ? "Submitting..." : "Submit application"}
            </Button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}