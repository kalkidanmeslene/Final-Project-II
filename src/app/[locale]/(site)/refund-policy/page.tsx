import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { RefundPolicyContent } from "@/components/legal/refund-policy-content";

export const metadata: Metadata = {
  title: "Refund Policy | Hibir Events",
  description: "Hibir Events refund policy — all ticket sales are final.",
};

export default function RefundPolicyPage() {
  return (
    <LegalDocument title="Refund Policy" lastUpdated="June 1, 2026">
      <RefundPolicyContent showLastUpdated={false} />
    </LegalDocument>
  );
}
