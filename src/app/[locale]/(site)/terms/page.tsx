import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { TermsOfServiceContent } from "@/components/legal/terms-of-service-content";

export const metadata: Metadata = {
  title: "Terms of Service | Hibir Events",
  description: "Terms and conditions for using Hibir Events to discover and book event tickets.",
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms and Conditions" lastUpdated="June 1, 2026">
      <TermsOfServiceContent showLastUpdated={false} />
    </LegalDocument>
  );
}
