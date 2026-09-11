import type { FastifyReply, FastifyRequest } from "fastify";

import { sendAppError } from "../errors/send-app-error.js";
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
}

export const meController = new MeController();
