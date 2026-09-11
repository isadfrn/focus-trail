import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    pomodoroSession: {
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
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

  it("deletes one session scoped to the user", async () => {
    prismaMock.pomodoroSession.deleteMany.mockResolvedValue({ count: 1 });
    await repository.deleteByIdForUser("u1", "s1");
    expect(prismaMock.pomodoroSession.deleteMany).toHaveBeenCalledWith({
      where: { id: "s1", userId: "u1" },
    });
  });

  it("deletes many sessions scoped to the user", async () => {
    prismaMock.pomodoroSession.deleteMany.mockResolvedValue({ count: 2 });
    await repository.deleteManyForUser("u1", ["s1", "s2"]);
    expect(prismaMock.pomodoroSession.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["s1", "s2"] }, userId: "u1" },
    });
  });

  it("deletes all sessions of the user", async () => {
    prismaMock.pomodoroSession.deleteMany.mockResolvedValue({ count: 5 });
    await repository.deleteAllForUser("u1");
    expect(prismaMock.pomodoroSession.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    });
  });
});
