import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../env.js", () => ({
  env: {
    EMAIL_ENABLED: true,
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-at-least-32-characters-long",
  },
}));
vi.mock("@node-rs/argon2", () => ({
  hash: vi.fn(async () => "hashed"),
  verify: vi.fn(async () => true),
}));

import { verify } from "@node-rs/argon2";

import {
  EmailNotVerifiedError,
  InvalidCodeError,
} from "../errors/app-error.js";
import type { AuthSessionRepository } from "../repositories/auth-session.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { AuthService } from "./auth.service.js";
import type { VerificationService } from "./verification.service.js";

describe("AuthService (email enabled)", () => {
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
  const verification = {
    issue: vi.fn(),
    check: vi.fn(),
  } as unknown as VerificationService;
  const authSessions = {
    create: vi.fn(),
    findActiveById: vi.fn(),
    revokeById: vi.fn(),
    revokeAllForUser: vi.fn(),
  } satisfies AuthSessionRepository;

  const service = new AuthService(users, verification, authSessions);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verify).mockResolvedValue(true);
  });

  it("registers as unverified and requires verification", async () => {
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue({ id: "1", email: "a@b.com" });

    const result = await service.register({
      email: "a@b.com",
      password: "password123",
    });

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ emailVerifiedAt: null }),
    );
    expect(result.verificationRequired).toBe(true);
  });

  it("blocks login for an unverified account", async () => {
    users.findByEmail.mockResolvedValue({
      id: "1",
      email: "a@b.com",
      character: "mario",
      focusMinutes: 25,
      breakMinutes: 5,
      passwordHash: "hashed",
      emailVerifiedAt: null,
    });
    await expect(
      service.login({ email: "a@b.com", password: "password123" }),
    ).rejects.toBeInstanceOf(EmailNotVerifiedError);
  });

  it("verifies email with a valid code and marks verified", async () => {
    users.findByEmail.mockResolvedValue({ id: "1", email: "a@b.com" });
    vi.mocked(verification.check).mockResolvedValue(true);
    users.markEmailVerified.mockResolvedValue({ id: "1", email: "a@b.com" });

    await service.verifyEmail("a@b.com", "123456");

    expect(verification.check).toHaveBeenCalledWith(
      "1",
      "email_verification",
      "123456",
    );
    expect(users.markEmailVerified).toHaveBeenCalledWith("1");
  });

  it("rejects an invalid verification code", async () => {
    users.findByEmail.mockResolvedValue({ id: "1", email: "a@b.com" });
    vi.mocked(verification.check).mockResolvedValue(false);

    await expect(
      service.verifyEmail("a@b.com", "000000"),
    ).rejects.toBeInstanceOf(InvalidCodeError);
    expect(users.markEmailVerified).not.toHaveBeenCalled();
  });

  it("resends verification only for an unverified account", async () => {
    users.findByEmail.mockResolvedValue({
      id: "1",
      email: "a@b.com",
      emailVerifiedAt: null,
    });
    await service.resendEmailVerification("a@b.com");
    expect(verification.issue).toHaveBeenCalledWith(
      { id: "1", email: "a@b.com" },
      "email_verification",
    );

    vi.mocked(verification.issue).mockClear();
    users.findByEmail.mockResolvedValue({
      id: "1",
      email: "a@b.com",
      emailVerifiedAt: new Date(),
    });
    await service.resendEmailVerification("a@b.com");
    expect(verification.issue).not.toHaveBeenCalled();
  });

  it("requests a password reset only for an existing account", async () => {
    users.findByEmail.mockResolvedValue(null);
    await service.requestPasswordReset("missing@b.com");
    expect(verification.issue).not.toHaveBeenCalled();

    users.findByEmail.mockResolvedValue({ id: "1", email: "a@b.com" });
    await service.requestPasswordReset("a@b.com");
    expect(verification.issue).toHaveBeenCalledWith(
      { id: "1", email: "a@b.com" },
      "password_reset",
    );
  });

  it("resets the password and revokes sessions on a valid code", async () => {
    users.findByEmail.mockResolvedValue({ id: "1", email: "a@b.com" });
    vi.mocked(verification.check).mockResolvedValue(true);

    await service.resetPassword("a@b.com", "123456", "newpassword1");

    expect(users.updatePassword).toHaveBeenCalledWith("1", "hashed");
    expect(authSessions.revokeAllForUser).toHaveBeenCalledWith("1");
  });

  it("rejects a reset with an invalid code", async () => {
    users.findByEmail.mockResolvedValue({ id: "1", email: "a@b.com" });
    vi.mocked(verification.check).mockResolvedValue(false);

    await expect(
      service.resetPassword("a@b.com", "000000", "newpassword1"),
    ).rejects.toBeInstanceOf(InvalidCodeError);
    expect(users.updatePassword).not.toHaveBeenCalled();
  });
});
