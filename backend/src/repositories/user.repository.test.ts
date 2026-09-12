import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../prisma.js", () => ({
  prisma: prismaMock,
}));

import { UserRepository } from "./user.repository.js";

const meSelect = {
  id: true,
  email: true,
  character: true,
  focusMinutes: true,
  breakMinutes: true,
  createdAt: true,
} as const;

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

  it("finds by id with the public select", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "1" });
    await repository.findById("1");
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      select: meSelect,
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

  it("finds the auth row (with password hash) by id", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "1",
      passwordHash: "hash",
    });
    await repository.findAuthById("1");
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      select: { id: true, passwordHash: true },
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
      select: meSelect,
    });
  });

  it("updates preferences", async () => {
    prismaMock.user.update.mockResolvedValue({ id: "1" });
    await repository.updatePreferences("1", { character: "luigi", focusMinutes: 50 });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { character: "luigi", focusMinutes: 50 },
      select: meSelect,
    });
  });

  it("updates the password hash", async () => {
    prismaMock.user.update.mockResolvedValue({ id: "1" });
    await repository.updatePassword("1", "new-hash");
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { passwordHash: "new-hash" },
      select: { id: true },
    });
  });
});
