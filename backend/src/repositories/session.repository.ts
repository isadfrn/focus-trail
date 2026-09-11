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
}

export const sessionRepository = new SessionRepository();
