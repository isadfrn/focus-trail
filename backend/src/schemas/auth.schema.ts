import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10)
  .max(200)
  .refine(
    (value) => /[A-Za-z]/.test(value) && /\d/.test(value),
    "Password must include at least one letter and one digit",
  );

export const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: passwordSchema,
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;

const emailField = z.string().email().max(254);
const codeField = z.string().regex(/^\d{6}$/, "Code must be 6 digits");

export const emailRequestSchema = z.object({ email: emailField });

export const verifyEmailSchema = z.object({
  email: emailField,
  code: codeField,
});

export const resetPasswordSchema = z.object({
  email: emailField,
  code: codeField,
  newPassword: passwordSchema,
});

export type EmailRequestInput = z.infer<typeof emailRequestSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
