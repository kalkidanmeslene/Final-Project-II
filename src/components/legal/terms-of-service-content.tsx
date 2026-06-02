import { LegalSection } from "@/components/legal/legal-document";

export function TermsOfServiceContent({
  onRefundPolicyClick,
  showLastUpdated = true,
}: {
  onRefundPolicyClick?: () => void;
  showLastUpdated?: boolean;
}) {
  return (
    <>
      {showLastUpdated && (
        <p className="mb-6 text-sm text-muted-foreground">Last updated: June 1, 2026</p>
      )}
      <div className="space-y-6">
        <LegalSection title="1. Agreement">
          <p>
            By creating an account, browsing events, or completing a booking on Hibir Events (“Hibir,” “we,” “us”), you
            agree to these Terms of Service. If you do not agree, do not use the platform.
          </p>
        </LegalSection>

        <LegalSection title="2. Our role">
          <p>
            Hibir Events provides a marketplace for event discovery, ticketing, and related tools. Event organizers are
            responsible for their events, schedules, venues, and fulfillment. Hibir is not the event host unless clearly
            stated.
          </p>
        </LegalSection>

        <LegalSection title="3. Accounts">
          <p>
            You must provide accurate registration information and keep your credentials secure. You are responsible for
            activity under your account. We may suspend or terminate accounts that violate these terms or applicable law.
          </p>
        </LegalSection>

        <LegalSection title="4. Bookings and tickets">
          <p>
            A booking is confirmed only after you complete checkout and receive a confirmation (including a ticket with QR
            code where applicable). Ticket types, prices, and availability are set by organizers and may change until
            purchase is completed.
          </p>
          <p>
            Tickets are for personal use unless transfer features are explicitly enabled for an event. You must present a
            valid ticket (or QR code) for entry. Duplication, resale in violation of organizer rules, or fraud may result
            in cancellation without refund.
          </p>
        </LegalSection>

        <LegalSection title="5. Payments">
          <p>
            Prices are shown in Ethiopian Birr (ETB) unless otherwise indicated. Payment processing may be simulated or
            integrated with third-party providers. You authorize charges for the total shown at checkout.
          </p>
        </LegalSection>

        <LegalSection title="6. Refunds">
          <p>
            <strong>All ticket sales are final.</strong> Hibir Events does not offer refunds except where required by
            applicable law. See our{" "}
            {onRefundPolicyClick ? (
              <button
                type="button"
                onClick={onRefundPolicyClick}
                className="text-primary underline hover:text-primary/80"
              >
                Refund Policy
              </button>
            ) : (
              <a href="/refund-policy" className="text-primary underline">
                Refund Policy
              </a>
            )}{" "}
            for details.
          </p>
        </LegalSection>

        <LegalSection title="7. Cancellations and changes">
          <p>
            If an organizer postpones or cancels an event, we will notify registered ticket holders when possible.
            Remedies (such as rescheduled admission) are determined by the organizer and our policies—not automatic cash
            refunds.
          </p>
        </LegalSection>

        <LegalSection title="8. Acceptable use">
          <p>
            You may not misuse the platform, attempt unauthorized access, scrape data, harass users, or upload unlawful
            content. Organizers must comply with local regulations for public events and accurate event listings.
          </p>
        </LegalSection>

        <LegalSection title="9. Disclaimers">
          <p>
            The platform is provided “as is.” We do not guarantee uninterrupted service or that events will occur as
            described. To the fullest extent permitted by law, Hibir disclaims warranties and limits liability for indirect
            or consequential damages arising from use of the service or attendance at events.
          </p>
        </LegalSection>

        <LegalSection title="10. Contact">
          <p>
            Questions about these terms:{" "}
            <a href="mailto:support@hibir.events" className="text-primary underline">
              support@hibir.events
            </a>
          </p>
        </LegalSection>
      </div>
    </>
  );
}
