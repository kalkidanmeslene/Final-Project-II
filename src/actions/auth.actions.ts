"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { isNextRedirectError } from "@/lib/auth/redirect-error";
import { organizerApplicationSchema, registerOrganizerSchema, registerSchema } from "@/lib/auth/auth.schemas";
import { registerAttendee, registerOrganizer, requestOrganizer } from "@/lib/auth/auth.service";
import { requireCurrentUser } from "@/lib/auth/session";
import { defaultDashboardPath } from "@/lib/auth/rbac";
import { setAuthCookies, signAccessToken } from "@/lib/auth/tokens";
import { findUserById } from "@/lib/auth/auth.repository";

export type SignupFormValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

export type AuthActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: SignupFormValues;
  /** Bumps on failed submit so the form remounts with `defaultValue`s. */
  formKey?: number;
};

function signupValuesFromFormData(formData: FormData): SignupFormValues {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phoneNumber: String(formData.get("phoneNumber") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
}

function signupErrorState(
  prev: AuthActionState,
  formData: FormData,
  body: { message: string; fieldErrors?: Record<string, string[]> },
): AuthActionState {
  return {
    ok: false,
    message: body.message,
    fieldErrors: body.fieldErrors,
    values: signupValuesFromFormData(formData),
    formKey: (prev.formKey ?? 0) + 1,
  };
}

export async function registerAction(prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    const parsed = registerSchema.parse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phoneNumber: formData.get("phoneNumber"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      preferredLanguage: formData.get("preferredLanguage") ?? "en",
    });

    await registerAttendee({
      fullName: parsed.fullName,
      email: parsed.email?.trim() ? parsed.email.trim() : null,
      phoneNumber: parsed.phoneNumber?.trim() ? parsed.phoneNumber.trim() : null,
      preferredLanguage: parsed.preferredLanguage,
      password: parsed.password,
    });

    const next = String(formData.get("next") ?? "").trim();
    const nextQuery =
      next && next.startsWith("/") && !next.startsWith("//")
        ? `&next=${encodeURIComponent(next)}`
        : "";
    redirect(`/login?registered=1${nextQuery}`);
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return signupErrorState(prev, formData, {
        message: "Email or phone number is already registered.",
      });
    }
    if (e instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of e.issues) {
        const key = issue.path.join(".") || "_";
        fieldErrors[key] = fieldErrors[key] ?? [];
        fieldErrors[key].push(issue.message);
      }
      return signupErrorState(prev, formData, {
        message: "Please fix the highlighted fields.",
        fieldErrors,
      });
    }
    return signupErrorState(prev, formData, {
      message: "Registration failed. Email or phone may already be in use.",
    });
  }
}

export async function registerOrganizerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const parsed = registerOrganizerSchema.parse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phoneNumber: formData.get("phoneNumber"),
      password: formData.get("password"),
      preferredLanguage: formData.get("preferredLanguage") ?? "en",
      displayName: formData.get("displayName"),
      portfolioUrl: formData.get("portfolioUrl"),
      contactPhone: formData.get("contactPhone"),
      city: formData.get("city"),
      about: formData.get("about"),
      referenceLinks: formData.get("referenceLinks"),
    });

    const links = String(parsed.referenceLinks ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    await registerOrganizer({
      fullName: parsed.fullName,
      email: parsed.email?.trim() ? parsed.email.trim() : null,
      phoneNumber: parsed.phoneNumber?.trim() ? parsed.phoneNumber.trim() : null,
      preferredLanguage: parsed.preferredLanguage,
      password: parsed.password,
      displayName: parsed.displayName,
      portfolioUrl: parsed.portfolioUrl?.trim() || null,
      contactPhone: parsed.contactPhone?.trim() || null,
      city: parsed.city?.trim() || null,
      about: parsed.about?.trim() || null,
      referenceLinks: links,
    });

    redirect("/login?registered=organizer");
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Email or phone number is already registered." };
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
    return { ok: false, message: "Registration failed. Please try again." };
  }
}

export async function submitOrganizerApplicationAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = organizerApplicationSchema.parse({
      displayName: formData.get("displayName"),
      portfolioUrl: formData.get("portfolioUrl"),
      city: formData.get("city"),
      contactPhone: formData.get("contactPhone"),
      about: formData.get("about"),
      referenceLinks: formData.get("referenceLinks"),
    });

    const links = String(parsed.referenceLinks ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    await requestOrganizer({
      userId: user.id,
      displayName: parsed.displayName,
      portfolioUrl: parsed.portfolioUrl?.trim() || null,
      city: parsed.city?.trim() || null,
      contactPhone: parsed.contactPhone?.trim() || null,
      about: parsed.about?.trim() || null,
      referenceLinks: links,
    });

    const fresh = await findUserById(user.id);
    if (fresh) {
      const accessToken = await signAccessToken({
        sub: fresh.id,
        role: fresh.role,
        status: fresh.status,
      });
      const { cookies } = await import("next/headers");
      const { REFRESH_COOKIE_NAME } = await import("@/lib/auth/tokens");
      const refresh = (await cookies()).get(REFRESH_COOKIE_NAME)?.value;
      if (refresh) {
        await setAuthCookies({ accessToken, refreshToken: refresh });
      }
    }

    redirect("/pending");
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, message: "Please sign in before submitting your application." };
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
    return { ok: false, message: "Could not submit application. Please try again." };
  }
}

export async function redirectToDashboard(role: "attendee" | "organizer" | "admin") {
  redirect(defaultDashboardPath(role));
}
