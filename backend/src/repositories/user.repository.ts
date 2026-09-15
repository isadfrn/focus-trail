import { prisma } from "../prisma.js";

const meSelect = {
  id: true,
  email: true,
  character: true,
  focusMinutes: true,
  breakMinutes: true,
  autoCycle: true,
  longBreakMinutes: true,
  pomodorosUntilLongBreak: true,
  dailyFocusGoalMinutes: true,
  createdAt: true,
} as const;

export interface PreferencesUpdate {
  character?: string;
  focusMinutes?: number;
  breakMinutes?: number;
  autoCycle?: boolean;
  longBreakMinutes?: number;
  pomodorosUntilLongBreak?: number;
  dailyFocusGoalMinutes?: number;
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

  findAuthById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, passwordHash: true },
    });
  }

  create(data: {
    email: string;
    passwordHash: string;
    emailVerifiedAt?: Date | null;
  }) {
    return prisma.user.create({
      data,
      select: meSelect,
    });
  }

  markEmailVerified(id: string) {
    return prisma.user.update({
      where: { id },
      data: { emailVerifiedAt: new Date() },
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

  deleteById(id: string) {
    return prisma.user.delete({
      where: { id },
      select: { id: true },
    });
  }
}

export const userRepository = new UserRepository();
