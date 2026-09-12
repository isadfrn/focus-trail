import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { env } from "../env.js";

export const VERIFICATION_PURPOSES = {
  emailVerification: "email_verification",
  passwordReset: "password_reset",
} as const;

export type VerificationPurpose =
  (typeof VERIFICATION_PURPOSES)[keyof typeof VERIFICATION_PURPOSES];

/** Codes expire quickly — short window keeps the 6-digit space safe. */
export const CODE_TTL_MS = 15 * 60 * 1000;

/** Cryptographically-random 6-digit code, zero-padded. */
export function generateCode(): string {
  return randomInt(0, 1_000_000)
    .toString()
    .padStart(6, "0");
}

/**
 * Keyed hash (HMAC with the app secret) so a database leak alone can't be
 * brute-forced back into the code.
 */
export function hashCode(code: string): string {
  return createHmac("sha256", env.JWT_SECRET).update(code).digest("hex");
}

export function verifyCode(code: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashCode(code), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
