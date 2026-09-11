import type { FastifyReply, FastifyRequest } from "fastify";

import { sendAppError } from "../errors/send-app-error.js";
import { parseBody } from "../lib/parse-body.js";
import { createSessionSchema } from "../schemas/session.schema.js";
import {
  sessionService,
  type SessionService,
} from "../services/session.service.js";

export class SessionController {
  constructor(private readonly sessions: SessionService = sessionService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(createSessionSchema, request.body, reply);
    if (!body) return;

    try {
      const session = await this.sessions.create(request.user.sub, body);
      return reply.code(201).send({ session });
    } catch (error) {
      return sendAppError(reply, error);
    }
  }

  async list(request: FastifyRequest) {
    const sessions = await this.sessions.list(request.user.sub);
    return { sessions };
  }
}

export const sessionController = new SessionController();
