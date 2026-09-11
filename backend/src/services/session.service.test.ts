import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "../errors/app-error.js";
import type { SessionRepository } from "../repositories/session.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { SessionService } from "./session.service.js";

describe("SessionService", () => {
  const sessions = {
    create: vi.fn(),
    listByUserId: vi.fn(),
  } satisfies SessionRepository;

  const users = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findCharacterById: vi.fn(),
    create: vi.fn(),
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
});
