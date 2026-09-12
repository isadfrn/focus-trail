import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/email.js", () => ({ sendEmail: vi.fn() }));
vi.mock("../lib/verification-code.js", () => ({
  generateCode: vi.fn(() => "123456"),
  hashCode: vi.fn(() => "hash-123456"),
  verifyCode: vi.fn(),
  CODE_TTL_MS: 15 * 60 * 1000,
  VERIFICATION_PURPOSES: {
    emailVerification: "email_verification",
    passwordReset: "password_reset",
  },
}));

import { sendEmail } from "../lib/email.js";
import { verifyCode } from "../lib/verification-code.js";
import type { VerificationCodeRepository } from "../repositories/verification-code.repository.js";
import { VerificationService } from "./verification.service.js";

describe("VerificationService", () => {
  const codes = {
    replaceForUserPurpose: vi.fn(),
    findActive: vi.fn(),
    consume: vi.fn(),
  } satisfies VerificationCodeRepository;

  const service = new VerificationService(codes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores a hashed code and emails the plaintext", async () => {
    await service.issue({ id: "1", email: "a@b.com" }, "email_verification");

    expect(codes.replaceForUserPurpose).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "1",
        purpose: "email_verification",
        codeHash: "hash-123456",
      }),
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.com" }),
    );
  });

  it("checks and consumes a valid code", async () => {
    codes.findActive.mockResolvedValue({ id: "c1", codeHash: "hash-123456" });
    vi.mocked(verifyCode).mockReturnValue(true);

    await expect(
      service.check("1", "email_verification", "123456"),
    ).resolves.toBe(true);
    expect(codes.consume).toHaveBeenCalledWith("c1");
  });

  it("returns false and doesn't consume when there's no active code", async () => {
    codes.findActive.mockResolvedValue(null);
    await expect(
      service.check("1", "email_verification", "123456"),
    ).resolves.toBe(false);
    expect(codes.consume).not.toHaveBeenCalled();
  });

  it("returns false for a wrong code", async () => {
    codes.findActive.mockResolvedValue({ id: "c1", codeHash: "hash-x" });
    vi.mocked(verifyCode).mockReturnValue(false);
    await expect(
      service.check("1", "email_verification", "000000"),
    ).resolves.toBe(false);
    expect(codes.consume).not.toHaveBeenCalled();
  });
});
