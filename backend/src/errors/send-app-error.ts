import { Prisma } from "@prisma/client";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

import { env } from "../env.js";
import { AppError, ConflictError } from "./app-error.js";

export function serializeError(error: unknown): {
  statusCode: number;
  body: { error: string };
} {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message },
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const conflict = new ConflictError();
    return {
      statusCode: conflict.statusCode,
      body: { error: conflict.message },
    };
  }

  return {
    statusCode: 500,
    body: { error: "Internal Server Error" },
  };
}

export function sendAppError(reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    const { statusCode, body } = serializeError(error);
    return reply.code(statusCode).send(body);
  }
  throw error;
}

export function registerErrorHandler(
  app: {
    setErrorHandler: (
      handler: (
        error: FastifyError,
        request: FastifyRequest,
        reply: FastifyReply,
      ) => void | Promise<void>,
    ) => void;
    log: { error: (obj: unknown, msg?: string) => void };
  },
) {
  app.setErrorHandler((error, _request, reply) => {
    if (reply.sent) return;

    const serialized = serializeError(error);
    if (serialized.statusCode >= 500) {
      app.log.error(error);
    }

    if (
      serialized.statusCode === 500 &&
      env.NODE_ENV === "development" &&
      !(error instanceof AppError)
    ) {
      const message =
        error instanceof Error ? error.message : "Internal Server Error";
      void reply.code(500).send({ error: message });
      return;
    }

    void reply.code(serialized.statusCode).send(serialized.body);
  });
}
