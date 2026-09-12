import type { FastifyReply, FastifyRequest } from "fastify";

import { sendAppError } from "../errors/send-app-error.js";
import { parseBody } from "../lib/parse-body.js";
import {
  changePasswordSchema,
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
}

export const meController = new MeController();
