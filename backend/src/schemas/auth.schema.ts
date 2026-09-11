import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
