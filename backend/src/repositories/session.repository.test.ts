import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    pomodoroSession: {
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock("../prisma.js", () => ({
  prisma: prismaMock,
}));

import { buildSessionWhere, SessionRepository } from "./session.repository.js";

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

  it("lists sessions with keyset pagination and no cursor", async () => {
    prismaMock.pomodoroSession.findMany.mockResolvedValue([]);
    await repository.listByUserId("u1", { limit: 20 });
    expect(prismaMock.pomodoroSession.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      take: 21,
    });
  });

  it("applies cursor and filters", async () => {
    prismaMock.pomodoroSession.findMany.mockResolvedValue([]);
    const from = new Date("2026-09-10T00:00:00.000Z");
    const to = new Date("2026-09-11T00:00:00.000Z");
    await repository.listByUserId("u1", {
      limit: 10,
      cursor: "cur",
      filters: {
        from,
        to,
        type: "focus",
        completed: true,
        durationOp: "gt",
        durationSeconds: 600,
      },
    });
    expect(prismaMock.pomodoroSession.findMany).toHaveBeenCalledWith({
      where: {
        userId: "u1",
        startedAt: { gte: from, lt: to },
        type: "focus",
        completed: true,
        durationSeconds: { gt: 600 },
      },
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      take: 11,
      cursor: { id: "cur" },
      skip: 1,
    });
  });

  it("lists every session of the user ordered chronologically", async () => {
    prismaMock.pomodoroSession.findMany.mockResolvedValue([]);
    await repository.listAllForUser("u1");
    expect(prismaMock.pomodoroSession.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: [{ startedAt: "asc" }, { id: "asc" }],
    });
  });

  it("aggregates daily stats through a raw grouped query", async () => {
    const rows = [
      {
        date: "2026-09-10",
        focusSeconds: 1500,
        breakSeconds: 300,
        completedFocus: 1,
        interruptedFocus: 0,
        sessions: 2,
      },
    ];
    prismaMock.$queryRaw.mockResolvedValue(rows);

    const from = new Date("2026-09-01T00:00:00.000Z");
    await expect(repository.listDailyStats("u1", from)).resolves.toEqual(rows);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
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

describe("buildSessionWhere", () => {
  it("scopes to the user with no filters", () => {
    expect(buildSessionWhere("u1")).toEqual({ userId: "u1" });
  });

  it("supports an exact duration and a single date bound", () => {
    const from = new Date("2026-09-10T00:00:00.000Z");
    expect(
      buildSessionWhere("u1", { durationOp: "eq", durationSeconds: 1500, from }),
    ).toEqual({ userId: "u1", startedAt: { gte: from }, durationSeconds: 1500 });
  });

  it("supports less-than duration and status", () => {
    expect(
      buildSessionWhere("u1", {
        durationOp: "lt",
        durationSeconds: 300,
        completed: false,
      }),
    ).toEqual({ userId: "u1", durationSeconds: { lt: 300 }, completed: false });
  });

  it("filters by task label with a case-insensitive contains", () => {
    expect(buildSessionWhere("u1", { task: "relatorio" })).toEqual({
      userId: "u1",
      taskLabel: { contains: "relatorio", mode: "insensitive" },
    });
  });
});
