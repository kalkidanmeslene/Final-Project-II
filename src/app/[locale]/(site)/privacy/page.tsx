import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy | Hibir Events",
  description: "How Hibir Events collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="June 1, 2026">
      <PrivacyPolicyContent showLastUpdated={false} />
    </LegalDocument>
  );
}
