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
