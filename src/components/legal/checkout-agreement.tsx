import { PolicyAgreement } from "@/components/legal/policy-agreement";

export function CheckoutAgreement({
  termsAccepted,
  onTermsAcceptedChange,
  isFreeCheckout,
}: {
  termsAccepted: boolean;
  onTermsAcceptedChange: (accepted: boolean) => void;
  isFreeCheckout: boolean;
}) {
  return (
    <PolicyAgreement
      checked={termsAccepted}
      onCheckedChange={onTermsAcceptedChange}
      showRefundInLabel={!isFreeCheckout}
      showNoRefundNotice={!isFreeCheckout}
    />
  );
}
