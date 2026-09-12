import { prisma } from "../prisma.js";

/** Fields safe to expose for the authenticated user (never the password hash). */
const meSelect = {
  id: true,
  email: true,
  character: true,
  focusMinutes: true,
  breakMinutes: true,
  createdAt: true,
} as const;

export interface PreferencesUpdate {
  character?: string;
  focusMinutes?: number;
  breakMinutes?: number;
}

export class UserRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: meSelect,
    });
  }

  findCharacterById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { character: true },
    });
  }

  /** Reads the password hash for verification (e.g. change-password flow). */
  findAuthById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, passwordHash: true },
    });
  }

  create(data: { email: string; passwordHash: string }) {
    return prisma.user.create({
      data,
      select: meSelect,
    });
  }

  updatePreferences(id: string, data: PreferencesUpdate) {
    return prisma.user.update({
      where: { id },
      data,
      select: meSelect,
    });
  }

  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true },
    });
  }
}

export const userRepository = new UserRepository();
