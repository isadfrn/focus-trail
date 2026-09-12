import { existsSync } from "node:fs";

import { z } from "zod";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const WEAK_JWT_SECRETS = new Set([
  "dev-change-me-please-use-a-long-random-string",
  "change-me",
  "changeme",
  "secret",
  "jwt-secret",
  "your-secret-here",
]);

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().int().positive().default(3001),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    JWT_SECRET: z
      .string()
      .min(32, "JWT_SECRET must be at least 32 characters long"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    SESSION_MAX_AGE: z.coerce
      .number()
      .int()
      .positive()
      .default(60 * 60 * 24 * 7),
    HOST: z.string().min(1).optional(),
    ENABLE_SWAGGER: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    // Email (Resend). When both are set, email flows (verification / password
    // reset) are enabled; otherwise the app falls back to direct registration.
    // Empty strings (e.g. an unset `${RESEND_API_KEY:-}` in compose) count as
    // absent instead of failing validation.
    RESEND_API_KEY: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().min(1).optional(),
    ),
    EMAIL_FROM: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().min(1).optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (WEAK_JWT_SECRETS.has(data.JWT_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must not be a known placeholder value",
      });
    }
  })
  .transform((data) => ({
    ...data,
    HOST:
      data.HOST ??
      (data.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
    ENABLE_SWAGGER: data.ENABLE_SWAGGER ?? false,
    EMAIL_ENABLED: Boolean(data.RESEND_API_KEY && data.EMAIL_FROM),
  }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
