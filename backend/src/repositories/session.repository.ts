import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma.js";

export interface CreatePomodoroSessionData {
  userId: string;
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
  type: string;
  completed: boolean;
  character: string;
}

export interface SessionFilters {
  from?: Date;
  to?: Date;
  type?: "focus" | "break";
  completed?: boolean;
  durationOp?: "eq" | "gt" | "lt";
  durationSeconds?: number;
}

export interface ListSessionsOptions {
  limit: number;
  cursor?: string;
  filters?: SessionFilters;
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
