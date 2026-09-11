import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    pomodoroSession: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../prisma.js", () => ({
  prisma: prismaMock,
}));

import { SessionRepository } from "./session.repository.js";

describe("SessionRepository", () => {
  const repository = new SessionRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a session", async () => {
    const data = {
      userId: "u1",
      startedAt: new Date("2026-09-10T20:00:00.000Z"),
      endedAt: new Date("2026-09-10T20:25:00.000Z"),
      durationSeconds: 1500,
      type: "focus",
      completed: true,
      character: "mario",
    };
    prismaMock.pomodoroSession.create.mockResolvedValue({ id: "s1", ...data });
    await repository.create(data);
    expect(prismaMock.pomodoroSession.create).toHaveBeenCalledWith({ data });
  });

  it("lists sessions by user", async () => {
    prismaMock.pomodoroSession.findMany.mockResolvedValue([]);
    await repository.listByUserId("u1");
    expect(prismaMock.pomodoroSession.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { startedAt: "desc" },
      take: 100,
    });
  });
});
