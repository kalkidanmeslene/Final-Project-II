import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),

  DATABASE_URL: z.string().min(1),

  AUTH_JWT_SECRET: z.string().min(32),
  AUTH_JWT_ISSUER: z.string().min(1).default("hibir-events"),
  AUTH_JWT_AUDIENCE: z.string().min(1).default("hibir-events:web"),

  AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60),
  AUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60),

  APP_BASE_URL: z.string().url().default("http://localhost:3000"),

  PROFILE_UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  EVENT_UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  EVENT_EDIT_LOCK_DAYS: z.coerce.number().int().positive().default(7),

  /** resend | smtp — defaults to resend when RESEND_API_KEY is set */
  EMAIL_PROVIDER: z.enum(["resend", "smtp"]).optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  EMAIL_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  /** In dev, send all mail to this address (required when using onboarding@resend.dev). */
  EMAIL_DEV_OVERRIDE_TO: z.string().email().optional(),
  CRON_SECRET: z.string().min(16).optional(),
});

export const env = envSchema.parse(process.env);

