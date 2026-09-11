import type { FastifyReply, FastifyRequest } from "fastify";

import { sendAppError } from "../errors/send-app-error.js";
import {
  COOKIE_NAME,
  issueSession,
  sessionCookieOptions,
} from "../lib/session.js";
import { credentialsSchema } from "../schemas/auth.schema.js";
import { authService, type AuthService } from "../services/auth.service.js";

export class AuthController {
  constructor(private readonly auth: AuthService = authService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid Body" });

    try {
      const user = await this.auth.register(parsed.data);
      await issueSession(reply, { sub: user.id, email: user.email });
      return reply.code(201).send({ user });
    } catch (error) {
      return sendAppError(reply, error);
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid Body" });

    try {
      const user = await this.auth.login(parsed.data);
      await issueSession(reply, { sub: user.id, email: user.email });
      return reply.send({ user });
    } catch (error) {
      return sendAppError(reply, error);
    }
  }

  async logout(_request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie(COOKIE_NAME, sessionCookieOptions());
    return reply.send({ ok: true });
  }
}

export const authController = new AuthController();
