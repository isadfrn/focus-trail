import type { FastifyReply, FastifyRequest } from "fastify";

import { sendAppError } from "../errors/send-app-error.js";
import { parseBody } from "../lib/parse-body.js";
import {
  COOKIE_NAME,
  revokeSession,
  sessionCookieOptions,
} from "../lib/session.js";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updatePreferencesSchema,
} from "../schemas/preferences.schema.js";
import { userService, type UserService } from "../services/user.service.js";

export class MeController {
  constructor(private readonly users: UserService = userService) {}

  async getMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await this.users.getMe(request.user.sub);
      return { user };
    } catch (error) {
      return sendAppError(reply, error);
    }
  }

  async updatePreferences(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(updatePreferencesSchema, request.body, reply);
    if (!body) return;

    try {
      const user = await this.users.updatePreferences(request.user.sub, body);
      return { user };
    } catch (error) {
      return sendAppError(reply, error);
    }
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(changePasswordSchema, request.body, reply);
    if (!body) return;

    try {
      await this.users.changePassword(request.user.sub, body);
      return { ok: true };
    } catch (error) {
      return sendAppError(reply, error);
    }
  }

  async exportData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.users.exportData(request.user.sub);
      reply.header(
        "Content-Disposition",
        'attachment; filename="focus-trail-export.json"',
      );
      return data;
    } catch (error) {
      return sendAppError(reply, error);
    }
  }

  async deleteAccount(request: FastifyRequest, reply: FastifyReply) {
    const body = parseBody(deleteAccountSchema, request.body, reply);
    if (!body) return;

    try {
      await this.users.deleteAccount(request.user.sub, body.password);
      if (request.user.jti) await revokeSession(request.user.jti);
      reply.clearCookie(COOKIE_NAME, sessionCookieOptions());
      return reply.send({ ok: true });
    } catch (error) {
      return sendAppError(reply, error);
    }
  }
}

export const meController = new MeController();
