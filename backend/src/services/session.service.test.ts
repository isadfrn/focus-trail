import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "../errors/app-error.js";
import type { SessionRepository } from "../repositories/session.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { SessionService } from "./session.service.js";

describe("SessionService", () => {
  const sessions = {
    create: vi.fn(),
    listByUserId: vi.fn(),
    listAllForUser: vi.fn(),
    listDailyStats: vi.fn(),
    deleteByIdForUser: vi.fn(),
    deleteManyForUser: vi.fn(),
    deleteAllForUser: vi.fn(),
  } satisfies SessionRepository;

  const users = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findCharacterById: vi.fn(),
    findAuthById: vi.fn(),
    create: vi.fn(),
    updatePreferences: vi.fn(),
    updatePassword: vi.fn(),
    markEmailVerified: vi.fn(),
    deleteById: vi.fn(),
  } satisfies UserRepository;

  const service = new SessionService(sessions, users);

  const input = {
    startedAt: "2026-09-10T20:00:00.000Z",
    endedAt: "2026-09-10T20:25:00.000Z",
    durationSeconds: 1500,
    type: "focus" as const,
    completed: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a session with the user character", async () => {
    users.findCharacterById.mockResolvedValue({ character: "luigi" });
    sessions.create.mockResolvedValue({ id: "s1" });

    await service.create("u1", input);

    expect(sessions.create).toHaveBeenCalledWith({
      userId: "u1",
      startedAt: new Date(input.startedAt),
      endedAt: new Date(input.endedAt),
      durationSeconds: 1500,
      type: "focus",
      completed: true,
      character: "luigi",
      taskLabel: null,
    });
  });

  it("forwards the task label when provided", async () => {
    users.findCharacterById.mockResolvedValue({ character: "luigi" });
    sessions.create.mockResolvedValue({ id: "s1" });

    await service.create("u1", { ...input, taskLabel: "Escrever relatorio" });

    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ taskLabel: "Escrever relatorio" }),
    );
  });

  it("throws when user is missing", async () => {
    users.findCharacterById.mockResolvedValue(null);
    await expect(service.create("missing", input)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("lists sessions with no next page when under the limit", async () => {
    sessions.listByUserId.mockResolvedValue([{ id: "s1" }]);
    await expect(service.list("u1", { limit: 20 })).resolves.toEqual({
      sessions: [{ id: "s1" }],
      nextCursor: null,
    });
    expect(sessions.listByUserId).toHaveBeenCalledWith("u1", {
      limit: 20,
      cursor: undefined,
      filters: {
        from: undefined,
        to: undefined,
        type: undefined,
        task: undefined,
        completed: undefined,
        durationOp: undefined,
        durationSeconds: undefined,
      },
    });
  });

  it("returns a nextCursor when another page exists", async () => {
    sessions.listByUserId.mockResolvedValue([
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ]);
    await expect(service.list("u1", { limit: 2 })).resolves.toEqual({
      sessions: [{ id: "a" }, { id: "b" }],
      nextCursor: "b",
    });
  });

  it("passes cursor and filters through, parsing the dates", async () => {
    sessions.listByUserId.mockResolvedValue([]);
    const from = "2026-09-10T00:00:00.000Z";
    const to = "2026-09-11T00:00:00.000Z";
    await service.list("u1", {
      limit: 20,
      cursor: "cur",
      from,
      to,
      type: "focus",
      task: "relatorio",
      completed: true,
      durationOp: "gt",
      durationSeconds: 600,
    });
    expect(sessions.listByUserId).toHaveBeenCalledWith("u1", {
      limit: 20,
      cursor: "cur",
      filters: {
        from: new Date(from),
        to: new Date(to),
        type: "focus",
        task: "relatorio",
        completed: true,
        durationOp: "gt",
        durationSeconds: 600,
      },
    });
  });

  it("aggregates stats and sums per-day rows into totals", async () => {
    sessions.listDailyStats.mockResolvedValue([
      {
        date: "2026-09-09",
        focusSeconds: 1500,
        breakSeconds: 300,
        completedFocus: 1,
        interruptedFocus: 0,
        sessions: 2,
      },
      {
        date: "2026-09-10",
        focusSeconds: 600,
        breakSeconds: 0,
        completedFocus: 0,
        interruptedFocus: 1,
        sessions: 1,
      },
    ]);

    const result = await service.stats("u1", {
      from: "2026-09-01T00:00:00.000Z",
    });

    expect(sessions.listDailyStats).toHaveBeenCalledWith(
      "u1",
      new Date("2026-09-01T00:00:00.000Z"),
      undefined,
    );
    expect(result.days).toHaveLength(2);
    expect(result.totals).toEqual({
      focusSeconds: 2100,
      breakSeconds: 300,
      completedFocus: 1,
      interruptedFocus: 1,
      sessions: 3,
    });
  });

  it("deletes one and returns the count", async () => {
    sessions.deleteByIdForUser.mockResolvedValue({ count: 1 });
    await expect(service.deleteOne("u1", "s1")).resolves.toBe(1);
    expect(sessions.deleteByIdForUser).toHaveBeenCalledWith("u1", "s1");
  });

  it("returns 0 when deleting a missing session", async () => {
    sessions.deleteByIdForUser.mockResolvedValue({ count: 0 });
    await expect(service.deleteOne("u1", "missing")).resolves.toBe(0);
  });

  it("deletes many and returns the count", async () => {
    sessions.deleteManyForUser.mockResolvedValue({ count: 2 });
    await expect(service.deleteMany("u1", ["s1", "s2"])).resolves.toBe(2);
    expect(sessions.deleteManyForUser).toHaveBeenCalledWith("u1", ["s1", "s2"]);
  });

  it("deletes all and returns the count", async () => {
    sessions.deleteAllForUser.mockResolvedValue({ count: 5 });
    await expect(service.deleteAll("u1")).resolves.toBe(5);
    expect(sessions.deleteAllForUser).toHaveBeenCalledWith("u1");
  });
});
