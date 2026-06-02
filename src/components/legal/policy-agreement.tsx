"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";
import { RefundPolicyContent } from "@/components/legal/refund-policy-content";
import { TermsOfServiceContent } from "@/components/legal/terms-of-service-content";

type PolicyModal = "terms" | "privacy" | "refund" | null;

function PolicyLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-primary underline hover:text-primary/80"
    >
      {children}
    </button>
  );
}

type PolicyAgreementProps = {
  id?: string;
  required?: boolean;
  checked?: boolean;
  onCheckedChange?: (accepted: boolean) => void;
  /** Show Refund Policy link in the checkbox label (e.g. hide for free RSVP checkout). */
  showRefundInLabel?: boolean;
  /** Show “all sales are final” notice next to the checkbox. */
  showNoRefundNotice?: boolean;
  className?: string;
};

export function PolicyAgreement({
  id = "terms",
  required,
  checked,
  onCheckedChange,
  showRefundInLabel = true,
  showNoRefundNotice = true,
  className,
}: PolicyAgreementProps) {
  const [openPolicy, setOpenPolicy] = useState<PolicyModal>(null);

  const checkboxProps =
    checked !== undefined && onCheckedChange
      ? { checked, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onCheckedChange(e.target.checked) }
      : {};

  return (
    <>
      <div className={className ?? "mb-6 flex items-start gap-2"}>
        <input
          type="checkbox"
          id={id}
          required={required}
          className="mt-0.5 h-4 w-4 shrink-0 rounded text-primary"
          {...checkboxProps}
        />
        <label htmlFor={id} className="text-sm leading-relaxed text-muted-foreground">
          I agree to the{" "}
          <PolicyLink onClick={() => setOpenPolicy("terms")}>Terms and Conditions</PolicyLink>
          {" and "}
          <PolicyLink onClick={() => setOpenPolicy("privacy")}>Privacy Policy</PolicyLink>
          {showRefundInLabel && (
            <>
              ,{" "}
              <PolicyLink onClick={() => setOpenPolicy("refund")}>Refund Policy</PolicyLink>
            </>
          )}
          .
          {showNoRefundNotice && (
            <>
              {" "}
              <span className="font-medium text-foreground">All sales are final — we do not offer refunds.</span>
            </>
          )}
        </label>
      </div>

      <Modal open={openPolicy === "terms"} onClose={() => setOpenPolicy(null)} title="Terms and Conditions">
        <TermsOfServiceContent
          onRefundPolicyClick={
            showRefundInLabel ? () => setOpenPolicy("refund") : undefined
          }
        />
      </Modal>

      <Modal open={openPolicy === "privacy"} onClose={() => setOpenPolicy(null)} title="Privacy Policy">
        <PrivacyPolicyContent />
      </Modal>

      {showRefundInLabel && (
        <Modal open={openPolicy === "refund"} onClose={() => setOpenPolicy(null)} title="Refund Policy">
          <RefundPolicyContent />
        </Modal>
      )}
    </>
  );
}
