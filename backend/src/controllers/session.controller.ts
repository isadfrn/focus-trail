import type { FastifyReply, FastifyRequest } from "fastify";

import { NotFoundError } from "../errors/app-error.js";
import { sendAppError } from "../errors/send-app-error.js";
import { parseBody } from "../lib/parse-body.js";
import {
  createSessionSchema,
  deleteSessionsSchema,
  listSessionsQuerySchema,
  sessionIdParamSchema,
} from "../schemas/session.schema.js";
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

  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = parseBody(listSessionsQuerySchema, request.query, reply);
    if (!query) return;

    return this.sessions.list(request.user.sub, query);
  }

  async remove(request: FastifyRequest, reply: FastifyReply) {
    const params = parseBody(sessionIdParamSchema, request.params, reply);
    if (!params) return;

    const deleted = await this.sessions.deleteOne(request.user.sub, params.id);
    if (deleted === 0) return sendAppError(reply, new NotFoundError());
    return reply.send({ deleted });
  }

  async removeMany(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(deleteSessionsSchema, request.body, reply);
    if (!body) return;

    const deleted = body.all
      ? await this.sessions.deleteAll(request.user.sub)
      : await this.sessions.deleteMany(request.user.sub, body.ids ?? []);
    return reply.send({ deleted });
  }
}

export const sessionController = new SessionController();
