import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, findFirst, updateMany } = vi.hoisted(() => ({
  create: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("../prisma.js", () => ({
  prisma: {
    authSession: {
      create,
      findFirst,
      updateMany,
    },
  },
}));

import { AuthSessionRepository } from "./auth-session.repository.js";

describe("AuthSessionRepository", () => {
  const repo = new AuthSessionRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a session", async () => {
    const expiresAt = new Date();
    create.mockResolvedValue({ id: "1" });
    await repo.create({ userId: "user-1", expiresAt });
    expect(create).toHaveBeenCalledWith({
      data: { userId: "user-1", expiresAt },
    });
  });

  it("finds an active session", async () => {
    findFirst.mockResolvedValue({ id: "1" });
    await repo.findActiveById("1");
    expect(findFirst).toHaveBeenCalledOnce();
    const arg = findFirst.mock.calls[0]?.[0] as {
      where: { id: string; revokedAt: null; expiresAt: { gt: Date } };
    };
    expect(arg.where.id).toBe("1");
    expect(arg.where.revokedAt).toBeNull();
    expect(arg.where.expiresAt.gt).toBeInstanceOf(Date);
  });

  it("revokes a session", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    await repo.revokeById("1");
    expect(updateMany).toHaveBeenCalledOnce();
    const arg = updateMany.mock.calls[0]?.[0] as {
      where: { id: string; revokedAt: null };
      data: { revokedAt: Date };
    };
    expect(arg.where).toEqual({ id: "1", revokedAt: null });
    expect(arg.data.revokedAt).toBeInstanceOf(Date);
  });
});
