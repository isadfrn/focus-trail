import type { FastifyReply } from "fastify";
import type { output, ZodTypeAny } from "zod";

export function parseBody<S extends ZodTypeAny>(
  schema: S,
  body: unknown,
  reply: FastifyReply,
): output<S> | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    void reply.code(400).send({ error: "Invalid Body" });
    return null;
  }
  return parsed.data;
}
