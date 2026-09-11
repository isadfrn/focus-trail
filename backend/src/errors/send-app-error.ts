import type { FastifyReply } from "fastify";

import { AppError } from "./app-error.js";

export function sendAppError(reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({ error: error.message });
  }
  throw error;
}
