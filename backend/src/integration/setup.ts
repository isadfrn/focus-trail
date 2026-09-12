import { afterAll, beforeEach } from "vitest";

import { prisma } from "../prisma.js";

// Start every test from a clean database so cases stay independent.
beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "pomodoro_sessions", "auth_sessions", "users" RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
