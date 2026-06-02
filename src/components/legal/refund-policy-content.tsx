import { LegalSection } from "@/components/legal/legal-document";

export function RefundPolicyContent({ showLastUpdated = true }: { showLastUpdated?: boolean }) {
  return (
    <>
      {showLastUpdated && (
        <p className="mb-6 text-sm text-muted-foreground">Last updated: June 1, 2026</p>
      )}
      <div className="space-y-6">
        <LegalSection title="No refunds">
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <strong>All ticket sales on Hibir Events are final.</strong> We do not offer refunds, credits, or exchanges
            once a booking is confirmed.
          </p>
        </LegalSection>

        <LegalSection title="Before you book">
          <p>
            Please review the event date, time, venue, ticket type, and price carefully before completing checkout. By
            confirming your booking, you acknowledge that you understand and accept this no-refund policy.
          </p>
        </LegalSection>

        <LegalSection title="Cancelled or postponed events">
          <p>
            If an organizer cancels or postpones an event, we will send notifications when possible. Any remedy (such as
            admission to a rescheduled date or an alternative offer) is at the organizer&apos;s discretion.{" "}
            <strong>
              Cancellation or postponement by an organizer does not automatically entitle you to a cash refund
            </strong>{" "}
            unless we or the organizer explicitly state otherwise in writing.
          </p>
        </LegalSection>

        <LegalSection title="Duplicate or fraudulent charges">
          <p>
            If you believe you were charged in error due to a technical duplicate transaction, contact us within 7 days
            at{" "}
            <a href="mailto:support@hibir.events" className="text-primary underline">
              support@hibir.events
            </a>{" "}
            with your booking reference. Verified duplicate charges may be reversed at our sole discretion; this is not a
            general refund program.
          </p>
        </LegalSection>

        <LegalSection title="Chargebacks">
          <p>
            Filing a payment chargeback without contacting us first may result in account suspension and invalidation of
            associated tickets.
          </p>
        </LegalSection>

        <LegalSection title="Legal rights">
          <p>
            Nothing in this policy limits rights you may have under mandatory consumer protection laws in Ethiopia or your
            jurisdiction that cannot be waived by contract.
          </p>
        </LegalSection>

        <LegalSection title="Questions">
          <p>
            For policy questions:{" "}
            <a href="mailto:support@hibir.events" className="text-primary underline">
              support@hibir.events
            </a>
          </p>
        </LegalSection>
      </div>
    </>
  );
}
