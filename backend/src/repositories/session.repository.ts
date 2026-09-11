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

export class SessionRepository {
  create(data: CreatePomodoroSessionData) {
    return prisma.pomodoroSession.create({ data });
  }

  listByUserId(userId: string) {
    return prisma.pomodoroSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 100,
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
