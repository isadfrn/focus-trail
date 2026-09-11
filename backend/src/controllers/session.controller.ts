import type { FastifyReply, FastifyRequest } from "fastify";

import { sendAppError } from "../errors/send-app-error.js";
import { createSessionSchema } from "../schemas/session.schema.js";
import {
  sessionService,
  type SessionService,
} from "../services/session.service.js";

export class SessionController {
  constructor(private readonly sessions: SessionService = sessionService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createSessionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid Body" });

    try {
      const session = await this.sessions.create(request.user.sub, parsed.data);
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
