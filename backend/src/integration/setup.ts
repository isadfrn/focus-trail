import { afterAll, beforeEach } from "vitest";

import { prisma } from "../prisma.js";

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "pomodoro_sessions", "auth_sessions", "users" RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
