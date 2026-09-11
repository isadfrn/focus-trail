import { z } from "zod";

export const createSessionSchema = z
  .object({
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime(),
    durationSeconds: z
      .number()
      .int()
      .min(0)
      .max(60 * 60 * 24),
    type: z.enum(["focus", "break"]),
    completed: z.boolean(),
  })
  .refine((v) => new Date(v.endedAt) >= new Date(v.startedAt), {
    message: "Ended At must be greater than or equal to Started At",
    path: ["endedAt"],
  });

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const sessionIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;

export const deleteSessionsSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(500).optional(),
    all: z.literal(true).optional(),
  })
  .refine((v) => (v.all === true) !== (v.ids !== undefined), {
    message: "Provide either 'ids' or 'all'",
  });

export type DeleteSessionsInput = z.infer<typeof deleteSessionsSchema>;
