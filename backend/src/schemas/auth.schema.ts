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
