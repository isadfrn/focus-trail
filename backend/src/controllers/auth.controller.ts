import type { FastifyReply, FastifyRequest } from "fastify";

import { sendAppError } from "../errors/send-app-error.js";
import { parseBody } from "../lib/parse-body.js";
import {
  COOKIE_NAME,
  issueSession,
  revokeSession,
  sessionCookieOptions,
} from "../lib/session.js";
import { credentialsSchema } from "../schemas/auth.schema.js";
import { authService, type AuthService } from "../services/auth.service.js";

export class AuthController {
  constructor(private readonly auth: AuthService = authService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(credentialsSchema, request.body, reply);
    if (!body) return;

    try {
      const user = await this.auth.register(body);
      await issueSession(reply, { sub: user.id, email: user.email });
      return reply.code(201).send({ user });
    } catch (error) {
      return sendAppError(reply, error);
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(credentialsSchema, request.body, reply);
    if (!body) return;

    try {
      const user = await this.auth.login(body);
      await issueSession(reply, { sub: user.id, email: user.email });
      return reply.send({ user });
    } catch (error) {
      return sendAppError(reply, error);
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      if (request.user.jti) {
        await revokeSession(request.user.jti);
      }
    } catch {
      void 0;
    }

    reply.clearCookie(COOKIE_NAME, sessionCookieOptions());
    return reply.send({ ok: true });
  }
}

export const authController = new AuthController();
