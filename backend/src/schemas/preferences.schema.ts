import { z } from "zod";

import { passwordSchema } from "./auth.schema.js";

export const updatePreferencesSchema = z
  .object({
    character: z.string().min(1).max(50).optional(),
    focusMinutes: z.number().int().min(1).max(180).optional(),
    breakMinutes: z.number().int().min(1).max(60).optional(),
  })
  .refine(
    (data) =>
      data.character !== undefined ||
      data.focusMinutes !== undefined ||
      data.breakMinutes !== undefined,
    "Provide at least one field to update",
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordSchema,
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
