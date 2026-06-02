import { z } from "zod";

export const phoneRegex = /^[+]?[\d\s().-]{7,20}$/;

export function optionalPhoneSchema() {
  return z.string().min(7).max(20).regex(phoneRegex, "Invalid phone number.").optional().or(z.literal(""));
}

export function requiredPhoneSchema() {
  return z.string().min(7).max(20).regex(phoneRegex, "Invalid phone number.");
}
