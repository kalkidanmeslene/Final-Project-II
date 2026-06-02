import { z } from "zod";
import { validateStrongPassword } from "@/lib/auth/password";
import { optionalPhoneSchema } from "@/lib/validation/phone";

const languageCodes = ["en", "am", "ar", "fr", "es", "de", "it", "pt", "sw", "om", "ti"] as const;

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required.").max(120),
    email: z.string().email("Invalid email.").optional().or(z.literal("")),
    phoneNumber: optionalPhoneSchema(),
    preferredLanguage: z.string().min(2, "Preferred language is required.").max(10),
    bio: z.string().max(500).optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    const hasEmail = !!val.email && val.email.trim().length > 0;
    const hasPhone = !!val.phoneNumber && val.phoneNumber.trim().length > 0;
    if (!hasEmail && !hasPhone) {
      ctx.addIssue({ code: "custom", message: "Email or phone number is required.", path: ["email"] });
      ctx.addIssue({ code: "custom", message: "Email or phone number is required.", path: ["phoneNumber"] });
    }
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(1, "New password is required."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .superRefine((val, ctx) => {
    const strong = validateStrongPassword(val.newPassword);
    if (!strong.ok) {
      ctx.addIssue({ code: "custom", message: strong.message, path: ["newPassword"] });
    }
    if (val.newPassword !== val.confirmPassword) {
      ctx.addIssue({ code: "custom", message: "Passwords do not match.", path: ["confirmPassword"] });
    }
    if (val.currentPassword === val.newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "New password must be different from current password.",
        path: ["newPassword"],
      });
    }
  });

export const preferredLanguageSchema = z.enum(languageCodes).or(z.string().min(2).max(10));

export const patchPreferredLanguageSchema = z.object({
  preferredLanguage: z.enum(["en", "am"]),
});

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;
