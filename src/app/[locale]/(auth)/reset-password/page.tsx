import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-zinc-500">Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
