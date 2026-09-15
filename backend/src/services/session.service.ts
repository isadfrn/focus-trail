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
  StatsQuery,
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
      taskLabel: input.taskLabel ?? null,
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
        task: query.task,
        completed: query.completed,
        durationOp: query.durationOp,
        durationSeconds: query.durationSeconds,
      },
    });

    const hasMore = rows.length > query.limit;
    const sessions = hasMore ? rows.slice(0, query.limit) : rows;
    const nextCursor = hasMore
      ? (sessions[sessions.length - 1]?.id ?? null)
      : null;
    return { sessions, nextCursor };
  }

  async stats(userId: string, query: StatsQuery) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const days = await this.sessions.listDailyStats(userId, from, to);

    const totals = days.reduce(
      (acc, day) => ({
        focusSeconds: acc.focusSeconds + day.focusSeconds,
        breakSeconds: acc.breakSeconds + day.breakSeconds,
        completedFocus: acc.completedFocus + day.completedFocus,
        interruptedFocus: acc.interruptedFocus + day.interruptedFocus,
        sessions: acc.sessions + day.sessions,
      }),
      {
        focusSeconds: 0,
        breakSeconds: 0,
        completedFocus: 0,
        interruptedFocus: 0,
        sessions: 0,
      },
    );

    return { days, totals };
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
