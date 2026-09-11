import { prisma } from "../prisma.js";

export class UserRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, character: true, createdAt: true },
    });
  }

  findCharacterById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { character: true },
    });
  }

  create(data: { email: string; passwordHash: string }) {
    return prisma.user.create({
      data,
      select: { id: true, email: true, character: true },
    });
  }
}

export const userRepository = new UserRepository();
