import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("../prisma.js", () => ({
  prisma: prismaMock,
}));

import { UserRepository } from "./user.repository.js";

describe("UserRepository", () => {
  const repository = new UserRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds by email", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "1" });
    await expect(repository.findByEmail("a@b.com")).resolves.toEqual({
      id: "1",
    });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "a@b.com" },
    });
  });

  it("finds by id with select", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "1" });
    await repository.findById("1");
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      select: { id: true, email: true, character: true, createdAt: true },
    });
  });

  it("finds character by id", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ character: "mario" });
    await repository.findCharacterById("1");
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      select: { character: true },
    });
  });

  it("creates a user", async () => {
    prismaMock.user.create.mockResolvedValue({
      id: "1",
      email: "a@b.com",
      character: "mario",
    });
    await repository.create({ email: "a@b.com", passwordHash: "hash" });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: "a@b.com", passwordHash: "hash" },
      select: { id: true, email: true, character: true },
    });
  });
});
