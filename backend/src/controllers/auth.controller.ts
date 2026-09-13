import type { FastifyReply, FastifyRequest } from "fastify";

import { sendAppError } from "../errors/send-app-error.js";
import { parseBody } from "../lib/parse-body.js";
import {
  COOKIE_NAME,
  issueSession,
  revokeSession,
  sessionCookieOptions,
} from "../lib/session.js";
import {
  credentialsSchema,
  emailRequestSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../schemas/auth.schema.js";
import { authService, type AuthService } from "../services/auth.service.js";

export class AuthController {
  constructor(private readonly auth: AuthService = authService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(credentialsSchema, request.body, reply);
    if (!body) return;

    try {
      const { user, verificationRequired } = await this.auth.register(body);

      if (verificationRequired) {
        await this.auth.sendEmailVerification(user).catch((error: unknown) => {
          request.log.error(error, "failed to send verification email");
        });
        return reply
          .code(202)
          .send({ verificationRequired: true, email: user.email });
      }

      await issueSession(reply, { sub: user.id, email: user.email });
      return reply.code(201).send({ user });
    } catch (error) {
      return sendAppError(reply, error);
    }
  }

  async verifyEmail(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(verifyEmailSchema, request.body, reply);
    if (!body) return;

    try {
      const user = await this.auth.verifyEmail(body.email, body.code);
      await issueSession(reply, { sub: user.id, email: user.email });
      return reply.send({ user });
    } catch (error) {
      return sendAppError(reply, error);
    }
  }

  async resendVerification(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(emailRequestSchema, request.body, reply);
    if (!body) return;

    await this.auth.resendEmailVerification(body.email).catch((error: unknown) => {
      request.log.error(error, "failed to resend verification email");
    });
    return reply.send({ ok: true });
  }

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(emailRequestSchema, request.body, reply);
    if (!body) return;

    await this.auth.requestPasswordReset(body.email).catch((error: unknown) => {
      request.log.error(error, "failed to send password reset email");
    });
    return reply.send({ ok: true });
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(resetPasswordSchema, request.body, reply);
    if (!body) return;

    try {
      await this.auth.resetPassword(body.email, body.code, body.newPassword);
      return reply.send({ ok: true });
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
