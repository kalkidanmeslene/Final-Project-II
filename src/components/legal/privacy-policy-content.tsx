import { LegalSection } from "@/components/legal/legal-document";

export function PrivacyPolicyContent({ showLastUpdated = true }: { showLastUpdated?: boolean }) {
  return (
    <>
      {showLastUpdated && (
        <p className="mb-6 text-sm text-muted-foreground">Last updated: June 1, 2026</p>
      )}
      <div className="space-y-6">
        <LegalSection title="1. Overview">
          <p>
            Hibir Events respects your privacy. This policy explains what information we collect, how we use it, and your
            choices when you use our website and services in Ethiopia and elsewhere.
          </p>
        </LegalSection>

        <LegalSection title="2. Information we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Account data:</strong> name, email, phone number, password (stored hashed), language preference,
              and profile details you provide.
            </li>
            <li>
              <strong>Booking data:</strong> events booked, ticket types, payment references, and QR/ticket identifiers.
            </li>
            <li>
              <strong>Technical data:</strong> device/browser type, IP address, cookies, and usage logs for security and
              analytics.
            </li>
            <li>
              <strong>Communications:</strong> support messages, notifications, and email preferences.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="3. How we use information">
          <p>We use your information to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Provide accounts, ticketing, check-in, and organizer tools</li>
            <li>Send booking confirmations, reminders, and service updates</li>
            <li>Prevent fraud, enforce terms, and maintain platform security</li>
            <li>Improve features and comply with legal obligations</li>
          </ul>
        </LegalSection>

        <LegalSection title="4. Sharing">
          <p>
            We share data with event organizers for events you book (e.g., attendee name and ticket status for entry). We
            may use service providers for hosting, email, and payments under confidentiality obligations. We do not sell
            your personal information.
          </p>
        </LegalSection>

        <LegalSection title="5. Retention and security">
          <p>
            We retain data as long as needed for bookings, legal compliance, and legitimate business purposes. We apply
            reasonable technical and organizational measures to protect data; no system is completely secure.
          </p>
        </LegalSection>

        <LegalSection title="6. Your choices">
          <p>
            You may update profile settings, manage notification preferences in your account, and contact us to request
            access or correction of your data where applicable law allows.
          </p>
        </LegalSection>

        <LegalSection title="7. Cookies">
          <p>
            We use cookies and similar technologies for authentication, locale/calendar preferences, and session
            management. You can control cookies through your browser settings.
          </p>
        </LegalSection>

        <LegalSection title="8. Children">
          <p>
            Hibir Events is not directed at children under 13. We do not knowingly collect data from children without
            parental consent.
          </p>
        </LegalSection>

        <LegalSection title="9. Changes">
          <p>
            We may update this policy from time to time. Material changes will be posted on this page with an updated
            “Last updated” date.
          </p>
        </LegalSection>

        <LegalSection title="10. Contact">
          <p>
            Privacy inquiries:{" "}
            <a href="mailto:privacy@hibir.events" className="text-primary underline">
              privacy@hibir.events
            </a>
          </p>
        </LegalSection>
      </div>
    </>
  );
}
