import { UnauthorizedError } from "../errors/app-error.js";
import {
  sessionRepository,
  type SessionRepository,
} from "../repositories/session.repository.js";
import {
  userRepository,
  type UserRepository,
} from "../repositories/user.repository.js";
import type {
  CreateSessionInput,
  ListSessionsQuery,
} from "../schemas/session.schema.js";

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

  async list(userId: string, query: ListSessionsQuery) {
    const rows = await this.sessions.listByUserId(userId, {
      limit: query.limit,
      cursor: query.cursor,
      filters: {
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
        type: query.type,
        completed: query.completed,
        durationOp: query.durationOp,
        durationSeconds: query.durationSeconds,
      },
    });

    // Fetched limit + 1 to detect a next page without a second query.
    const hasMore = rows.length > query.limit;
    const sessions = hasMore ? rows.slice(0, query.limit) : rows;
    const nextCursor = hasMore
      ? (sessions[sessions.length - 1]?.id ?? null)
      : null;
    return { sessions, nextCursor };
  }

  async deleteOne(userId: string, id: string) {
    const { count } = await this.sessions.deleteByIdForUser(userId, id);
    return count;
  }

  async deleteMany(userId: string, ids: string[]) {
    const { count } = await this.sessions.deleteManyForUser(userId, ids);
    return count;
  }

  async deleteAll(userId: string) {
    const { count } = await this.sessions.deleteAllForUser(userId);
    return count;
  }
}

export const sessionService = new SessionService();
