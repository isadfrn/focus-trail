import { UnauthorizedError } from "../errors/app-error.js";
import {
  sessionRepository,
  type SessionRepository,
} from "../repositories/session.repository.js";
import {
  userRepository,
  type UserRepository,
} from "../repositories/user.repository.js";
import type { CreateSessionInput } from "../schemas/session.schema.js";

export class SessionService {
  constructor(
    private readonly sessions: SessionRepository = sessionRepository,
    private readonly users: UserRepository = userRepository,
  ) {}

  async create(userId: string, input: CreateSessionInput) {
    const user = await this.users.findCharacterById(userId);
    if (!user) throw new UnauthorizedError();

    return this.sessions.create({
      userId,
      startedAt: new Date(input.startedAt),
      endedAt: new Date(input.endedAt),
      durationSeconds: input.durationSeconds,
      type: input.type,
      completed: input.completed,
      character: user.character,
    });
  }

  list(userId: string) {
    return this.sessions.listByUserId(userId);
  }
}

export const sessionService = new SessionService();
