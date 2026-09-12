import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "../errors/app-error.js";
import type { SessionRepository } from "../repositories/session.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { SessionService } from "./session.service.js";

describe("SessionService", () => {
  const sessions = {
    create: vi.fn(),
    listByUserId: vi.fn(),
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
    });
  });

  it("throws when user is missing", async () => {
    users.findCharacterById.mockResolvedValue(null);
    await expect(service.create("missing", input)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("lists sessions", async () => {
    sessions.listByUserId.mockResolvedValue([{ id: "s1" }]);
    await expect(service.list("u1")).resolves.toEqual([{ id: "s1" }]);
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
