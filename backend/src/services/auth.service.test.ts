import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConflictError, InvalidCredentialsError } from "../errors/app-error.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { AuthService, DUMMY_PASSWORD_HASH } from "./auth.service.js";

vi.mock("@node-rs/argon2", () => ({
  hash: vi.fn(async () => "hashed"),
  verify: vi.fn(async () => true),
}));

import { hash, verify } from "@node-rs/argon2";

describe("AuthService (email disabled)", () => {
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

  const service = new AuthService(users);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verify).mockResolvedValue(true);
  });

  it("registers a normalized, already-verified email", async () => {
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue({
      id: "1",
      email: "user@example.com",
      character: "mario",
    });

    const result = await service.register({
      email: "  User@Example.com ",
      password: "password123",
    });

    expect(hash).toHaveBeenCalledWith("password123");
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        passwordHash: "hashed",
        emailVerifiedAt: expect.any(Date),
      }),
    );
    expect(result.verificationRequired).toBe(false);
    expect(result.user.email).toBe("user@example.com");
  });

  it("rejects duplicate email after dummy hash work", async () => {
    users.findByEmail.mockResolvedValue({ id: "1" });
    await expect(
      service.register({ email: "user@example.com", password: "password123" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(hash).toHaveBeenCalledWith("password123");
  });

  it("logs in with valid credentials", async () => {
    users.findByEmail.mockResolvedValue({
      id: "1",
      email: "user@example.com",
      character: "mario",
      focusMinutes: 25,
      breakMinutes: 5,
      passwordHash: "hashed",
      emailVerifiedAt: new Date(),
    });

    await expect(
      service.login({ email: "user@example.com", password: "password123" }),
    ).resolves.toEqual({
      id: "1",
      email: "user@example.com",
      character: "mario",
      focusMinutes: 25,
      breakMinutes: 5,
    });
  });

  it("rejects unknown user after dummy verify", async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: "missing@example.com", password: "password123" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(verify).toHaveBeenCalledWith(DUMMY_PASSWORD_HASH, "password123");
  });

  it("rejects invalid password", async () => {
    users.findByEmail.mockResolvedValue({
      id: "1",
      email: "user@example.com",
      character: "mario",
      passwordHash: "hashed",
    });
    vi.mocked(verify).mockResolvedValue(false);

    await expect(
      service.login({ email: "user@example.com", password: "wrong-password" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
