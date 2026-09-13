import { prisma } from "../prisma.js";

export class VerificationCodeRepository {
  async replaceForUserPurpose(data: {
    userId: string;
    purpose: string;
    codeHash: string;
    expiresAt: Date;
  }) {
    await prisma.$transaction([
      prisma.verificationCode.deleteMany({
        where: { userId: data.userId, purpose: data.purpose },
      }),
      prisma.verificationCode.create({ data }),
    ]);
  }

  findActive(userId: string, purpose: string) {
    return prisma.verificationCode.findFirst({
      where: {
        userId,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  consume(id: string) {
    return prisma.verificationCode.updateMany({
      where: { id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }
}

export const verificationCodeRepository = new VerificationCodeRepository();
