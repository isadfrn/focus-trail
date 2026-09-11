import type { FastifyReply } from "fastify";
import type { ZodType } from "zod";

export function parseBody<T>(
  schema: ZodType<T>,
  body: unknown,
  reply: FastifyReply,
): T | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    void reply.code(400).send({ error: "Invalid Body" });
    return null;
  }
  return parsed.data;
}
