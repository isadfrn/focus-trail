import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "../errors/app-error.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { UserService } from "./user.service.js";

describe("UserService", () => {
  const users = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findCharacterById: vi.fn(),
    create: vi.fn(),
  } satisfies UserRepository;

  const service = new UserService(users);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current user", async () => {
    const user = {
      id: "1",
      email: "a@b.com",
      character: "mario",
      createdAt: new Date(),
    };
    users.findById.mockResolvedValue(user);
    await expect(service.getMe("1")).resolves.toEqual(user);
  });

  it("throws when user is missing", async () => {
    users.findById.mockResolvedValue(null);
    await expect(service.getMe("missing")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
