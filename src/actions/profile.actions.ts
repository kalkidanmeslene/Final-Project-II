"use server";

import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/profile/profile.schemas";
import { changePassword } from "@/lib/profile/profile.service";

export type ProfileActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function changePasswordAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = changePasswordSchema.parse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const result = await changePassword({
      userId: user.id,
      currentPassword: parsed.currentPassword,
      newPassword: parsed.newPassword,
    });

    if (!result.ok) {
      return { ok: false, message: "Current password is incorrect." };
    }

    return { ok: true, message: "Password changed successfully." };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, message: "Please sign in again to change your password." };
    }
    if (e instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of e.issues) {
        const key = issue.path.join(".") || "_";
        fieldErrors[key] = fieldErrors[key] ?? [];
        fieldErrors[key].push(issue.message);
      }
      return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
    }
    return { ok: false, message: "Failed to change password. Please try again." };
  }
}
