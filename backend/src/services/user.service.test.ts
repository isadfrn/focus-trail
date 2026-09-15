import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  InvalidCredentialsError,
  UnauthorizedError,
} from "../errors/app-error.js";
import type { SessionRepository } from "../repositories/session.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { UserService } from "./user.service.js";

vi.mock("@node-rs/argon2", () => ({
  hash: vi.fn(async () => "new-hash"),
  verify: vi.fn(async () => true),
}));

import { hash, verify } from "@node-rs/argon2";

describe("UserService", () => {
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

  const sessions = {
    create: vi.fn(),
    listByUserId: vi.fn(),
    listAllForUser: vi.fn(),
    listDailyStats: vi.fn(),
    deleteByIdForUser: vi.fn(),
    deleteManyForUser: vi.fn(),
    deleteAllForUser: vi.fn(),
  } satisfies SessionRepository;

  const service = new UserService(users, sessions);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verify).mockResolvedValue(true);
  });

  it("returns the current user", async () => {
    const user = {
      id: "1",
      email: "a@b.com",
      character: "mario",
      focusMinutes: 25,
      breakMinutes: 5,
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

  it("updates preferences through the repository", async () => {
    const updated = {
      id: "1",
      email: "a@b.com",
      character: "luigi",
      focusMinutes: 50,
      breakMinutes: 10,
      createdAt: new Date(),
    };
    users.updatePreferences.mockResolvedValue(updated);

    await expect(
      service.updatePreferences("1", { character: "luigi", focusMinutes: 50 }),
    ).resolves.toEqual(updated);
    expect(users.updatePreferences).toHaveBeenCalledWith("1", {
      character: "luigi",
      focusMinutes: 50,
    });
  });

  it("changes the password after verifying the current one", async () => {
    users.findAuthById.mockResolvedValue({ id: "1", passwordHash: "old-hash" });

    await service.changePassword("1", {
      currentPassword: "currentpass1",
      newPassword: "newpassword1",
    });

    expect(verify).toHaveBeenCalledWith("old-hash", "currentpass1");
    expect(hash).toHaveBeenCalledWith("newpassword1");
    expect(users.updatePassword).toHaveBeenCalledWith("1", "new-hash");
  });

  it("rejects a wrong current password", async () => {
    users.findAuthById.mockResolvedValue({ id: "1", passwordHash: "old-hash" });
    vi.mocked(verify).mockResolvedValue(false);

    await expect(
      service.changePassword("1", {
        currentPassword: "wrongpass1",
        newPassword: "newpassword1",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(hash).not.toHaveBeenCalled();
    expect(users.updatePassword).not.toHaveBeenCalled();
  });

  it("throws when the user no longer exists", async () => {
    users.findAuthById.mockResolvedValue(null);

    await expect(
      service.changePassword("missing", {
        currentPassword: "currentpass1",
        newPassword: "newpassword1",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("exports the user and all of their sessions", async () => {
    const user = { id: "1", email: "a@b.com", character: "mario" };
    const rows = [{ id: "s1" }, { id: "s2" }];
    users.findById.mockResolvedValue(user);
    sessions.listAllForUser.mockResolvedValue(rows);

    const result = await service.exportData("1");

    expect(result.user).toEqual(user);
    expect(result.sessions).toEqual(rows);
    expect(typeof result.exportedAt).toBe("string");
    expect(sessions.listAllForUser).toHaveBeenCalledWith("1");
  });

  it("throws when exporting a missing user", async () => {
    users.findById.mockResolvedValue(null);
    await expect(service.exportData("missing")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(sessions.listAllForUser).not.toHaveBeenCalled();
  });

  it("deletes the account after verifying the password", async () => {
    users.findAuthById.mockResolvedValue({ id: "1", passwordHash: "hash" });

    await service.deleteAccount("1", "password123");

    expect(verify).toHaveBeenCalledWith("hash", "password123");
    expect(users.deleteById).toHaveBeenCalledWith("1");
  });

  it("rejects account deletion with a wrong password", async () => {
    users.findAuthById.mockResolvedValue({ id: "1", passwordHash: "hash" });
    vi.mocked(verify).mockResolvedValue(false);

    await expect(
      service.deleteAccount("1", "wrong-password"),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(users.deleteById).not.toHaveBeenCalled();
  });

  it("throws when deleting a missing account", async () => {
    users.findAuthById.mockResolvedValue(null);
    await expect(
      service.deleteAccount("missing", "password123"),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
