import { existsSync } from "node:fs";

import { z } from "zod";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters long"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SESSION_MAX_AGE: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 7),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
