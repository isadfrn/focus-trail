import { Prisma } from "@prisma/client";

import { prisma } from "../prisma.js";

export interface CreatePomodoroSessionData {
  userId: string;
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
  type: string;
  completed: boolean;
  character: string;
  taskLabel?: string | null;
}

export interface SessionFilters {
  from?: Date;
  to?: Date;
  type?: "focus" | "break";
  task?: string;
  completed?: boolean;
  durationOp?: "eq" | "gt" | "lt";
  durationSeconds?: number;
}

export interface ListSessionsOptions {
  limit: number;
  cursor?: string;
  filters?: SessionFilters;
}

export interface DailyStatRow {
  date: string;
  focusSeconds: number;
  breakSeconds: number;
  completedFocus: number;
  interruptedFocus: number;
  sessions: number;
}

export function buildSessionWhere(
  userId: string,
  filters: SessionFilters = {},
): Prisma.PomodoroSessionWhereInput {
  const where: Prisma.PomodoroSessionWhereInput = { userId };

  if (filters.from || filters.to) {
    where.startedAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lt: filters.to } : {}),
    };
  }
  if (filters.type) where.type = filters.type;
  if (filters.task)
    where.taskLabel = { contains: filters.task, mode: "insensitive" };
  if (filters.completed !== undefined) where.completed = filters.completed;
  if (filters.durationOp && filters.durationSeconds !== undefined) {
    where.durationSeconds =
      filters.durationOp === "eq"
        ? filters.durationSeconds
        : filters.durationOp === "gt"
          ? { gt: filters.durationSeconds }
          : { lt: filters.durationSeconds };
  }

  return where;
}

export class SessionRepository {
  create(data: CreatePomodoroSessionData) {
    return prisma.pomodoroSession.create({ data });
  }

  listByUserId(userId: string, options: ListSessionsOptions) {
    const { limit, cursor, filters } = options;
    return prisma.pomodoroSession.findMany({
      where: buildSessionWhere(userId, filters),
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  listAllForUser(userId: string) {
    return prisma.pomodoroSession.findMany({
      where: { userId },
      orderBy: [{ startedAt: "asc" }, { id: "asc" }],
    });
  }

  listDailyStats(userId: string, from?: Date, to?: Date) {
    const conditions = [Prisma.sql`user_id = ${userId}::uuid`];
    if (from) conditions.push(Prisma.sql`started_at >= ${from}`);
    if (to) conditions.push(Prisma.sql`started_at < ${to}`);
    const where = Prisma.join(conditions, " AND ");

    return prisma.$queryRaw<DailyStatRow[]>`
      SELECT to_char(date_trunc('day', started_at), 'YYYY-MM-DD') AS "date",
             COALESCE(SUM(CASE WHEN type = 'focus' THEN duration_seconds ELSE 0 END), 0)::int AS "focusSeconds",
             COALESCE(SUM(CASE WHEN type = 'break' THEN duration_seconds ELSE 0 END), 0)::int AS "breakSeconds",
             COALESCE(SUM(CASE WHEN type = 'focus' AND completed THEN 1 ELSE 0 END), 0)::int AS "completedFocus",
             COALESCE(SUM(CASE WHEN type = 'focus' AND NOT completed THEN 1 ELSE 0 END), 0)::int AS "interruptedFocus",
             COUNT(*)::int AS "sessions"
      FROM pomodoro_sessions
      WHERE ${where}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
  }

  deleteByIdForUser(userId: string, id: string) {
    return prisma.pomodoroSession.deleteMany({ where: { id, userId } });
  }

  deleteManyForUser(userId: string, ids: string[]) {
    return prisma.pomodoroSession.deleteMany({
      where: { id: { in: ids }, userId },
    });
  }

  deleteAllForUser(userId: string) {
    return prisma.pomodoroSession.deleteMany({ where: { userId } });
  }
}

export const sessionRepository = new SessionRepository();
