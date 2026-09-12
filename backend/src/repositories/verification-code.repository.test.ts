import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    verificationCode: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../prisma.js", () => ({ prisma: prismaMock }));

import { VerificationCodeRepository } from "./verification-code.repository.js";

describe("VerificationCodeRepository", () => {
  const repository = new VerificationCodeRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replaces prior codes and creates a new one in a transaction", async () => {
    prismaMock.$transaction.mockResolvedValue([]);
    const data = {
      userId: "1",
      purpose: "email_verification",
      codeHash: "h",
      expiresAt: new Date(),
    };

    await repository.replaceForUserPurpose(data);

    expect(prismaMock.verificationCode.deleteMany).toHaveBeenCalledWith({
      where: { userId: "1", purpose: "email_verification" },
    });
    expect(prismaMock.verificationCode.create).toHaveBeenCalledWith({ data });
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
  });

  it("finds the latest active code", async () => {
    prismaMock.verificationCode.findFirst.mockResolvedValue(null);
    await repository.findActive("1", "password_reset");
    expect(prismaMock.verificationCode.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "1",
          purpose: "password_reset",
          consumedAt: null,
        }),
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("consumes a code", async () => {
    prismaMock.verificationCode.updateMany.mockResolvedValue({ count: 1 });
    await repository.consume("c1");
    expect(prismaMock.verificationCode.updateMany).toHaveBeenCalledWith({
      where: { id: "c1", consumedAt: null },
      data: { consumedAt: expect.any(Date) },
    });
  });
});
