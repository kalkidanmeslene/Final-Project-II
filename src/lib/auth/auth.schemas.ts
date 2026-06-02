import { z } from "zod";
import { validateStrongPassword } from "./password";

const phoneRegex = /^[+]?[\d\s().-]{7,20}$/;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required."),
    email: z.string().email().optional().or(z.literal("")),
    phoneNumber: z.string().min(7).max(20).regex(phoneRegex, "Invalid phone number.").optional().or(z.literal("")),
    password: z.string().min(1),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    preferredLanguage: z.string().min(2).max(10).optional().default("en"),
  })
  .superRefine((val, ctx) => {
    const hasEmail = !!val.email && val.email.trim().length > 0;
    const hasPhone = !!val.phoneNumber && val.phoneNumber.trim().length > 0;
    if (!hasEmail && !hasPhone) {
      ctx.addIssue({ code: "custom", message: "Email or phone number is required.", path: ["email"] });
      ctx.addIssue({ code: "custom", message: "Email or phone number is required.", path: ["phoneNumber"] });
    }

    const strong = validateStrongPassword(val.password);
    if (!strong.ok) {
      ctx.addIssue({ code: "custom", message: strong.message, path: ["password"] });
    }

    if (val.password !== val.confirmPassword) {
      ctx.addIssue({ code: "custom", message: "Passwords do not match.", path: ["confirmPassword"] });
    }
  });

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required."),
  password: z.string().min(1, "Password is required."),
});

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || /^https?:\/\/.+/i.test(v), "Enter a valid URL starting with http:// or https://");

export const organizerApplicationSchema = z.object({
  displayName: z.string().min(2, "Display / brand name is required."),
  portfolioUrl: optionalUrl,
  city: z.string().max(120).optional().or(z.literal("")),
  contactPhone: z.string().regex(phoneRegex, "Invalid phone number.").optional().or(z.literal("")),
  about: z.string().max(500).optional().or(z.literal("")),
  referenceLinks: z.string().optional().or(z.literal("")),
});

const organizerRequestBodySchema = z.object({
  displayName: z.string().min(2).optional(),
  organizationName: z.string().min(2).optional(),
  portfolioUrl: z.string().optional(),
  organizationWebsite: z.string().optional(),
  city: z.string().max(120).optional(),
  organizationAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  organizationPhone: z.string().optional(),
  about: z.string().max(500).optional(),
  referenceLinks: z.string().optional(),
  verificationDocsUrls: z.array(z.string()).optional(),
});

export function parseOrganizerRequestBody(body: unknown) {
  const raw = organizerRequestBodySchema.parse(body);
  return organizerApplicationSchema.parse({
    displayName: (raw.displayName ?? raw.organizationName ?? "").trim(),
    portfolioUrl: (raw.portfolioUrl ?? raw.organizationWebsite ?? "").trim(),
    city: (raw.city ?? raw.organizationAddress ?? "").trim(),
    contactPhone: (raw.contactPhone ?? raw.organizationPhone ?? "").trim(),
    about: (raw.about ?? "").trim(),
    referenceLinks:
      raw.referenceLinks?.trim()
      || (raw.verificationDocsUrls?.length ? raw.verificationDocsUrls.join("\n") : ""),
  });
}

export const registerOrganizerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required."),
    email: z.string().email().optional().or(z.literal("")),
    phoneNumber: z.string().min(7).max(20).regex(phoneRegex, "Invalid phone number.").optional().or(z.literal("")),
    password: z.string().min(1),
    preferredLanguage: z.string().min(2).max(10).optional().default("en"),
    displayName: z.string().min(2, "Display / brand name is required."),
    portfolioUrl: optionalUrl,
    contactPhone: z.string().regex(phoneRegex, "Invalid phone number.").optional().or(z.literal("")),
    city: z.string().max(120).optional().or(z.literal("")),
    about: z.string().max(500).optional().or(z.literal("")),
    referenceLinks: z.string().optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    const hasEmail = !!val.email && val.email.trim().length > 0;
    const hasPhone = !!val.phoneNumber && val.phoneNumber.trim().length > 0;
    if (!hasEmail && !hasPhone) {
      ctx.addIssue({ code: "custom", message: "Email or phone number is required.", path: ["email"] });
    }
    const strong = validateStrongPassword(val.password);
    if (!strong.ok) {
      ctx.addIssue({ code: "custom", message: strong.message, path: ["password"] });
    }
  });

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(1),
  })
  .superRefine((val, ctx) => {
    const strong = validateStrongPassword(val.newPassword);
    if (!strong.ok) {
      ctx.addIssue({ code: "custom", message: strong.message, path: ["newPassword"] });
    }
  });

