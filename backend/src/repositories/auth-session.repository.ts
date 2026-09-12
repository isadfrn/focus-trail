import { prisma } from "../prisma.js";

export class AuthSessionRepository {
  create(data: { userId: string; expiresAt: Date }) {
    return prisma.authSession.create({
      data: {
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  }

  findActiveById(id: string) {
    return prisma.authSession.findFirst({
      where: {
        id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  revokeById(id: string) {
    return prisma.authSession.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllForUser(userId: string) {
    return prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export const authSessionRepository = new AuthSessionRepository();
