import { z } from "zod";

import { passwordSchema } from "./auth.schema.js";

export const updatePreferencesSchema = z
  .object({
    character: z.string().min(1).max(50).optional(),
    focusMinutes: z.number().int().min(1).max(180).optional(),
    breakMinutes: z.number().int().min(1).max(60).optional(),
    autoCycle: z.boolean().optional(),
    longBreakMinutes: z.number().int().min(1).max(60).optional(),
    pomodorosUntilLongBreak: z.number().int().min(1).max(12).optional(),
    dailyFocusGoalMinutes: z.number().int().min(0).max(1440).optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    "Provide at least one field to update",
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(200),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
