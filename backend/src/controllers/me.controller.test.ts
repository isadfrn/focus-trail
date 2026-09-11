import type { FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "../errors/app-error.js";
import type { UserService } from "../services/user.service.js";
import { MeController } from "./me.controller.js";

describe("MeController", () => {
  const users = {
    getMe: vi.fn(),
  } as unknown as UserService;

  const controller = new MeController(users);

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
    vi.mocked(users.getMe).mockResolvedValue(user);

    await expect(
      controller.getMe(
        { user: { sub: "1", email: "a@b.com" } } as FastifyRequest,
        { code: vi.fn() } as never,
      ),
    ).resolves.toEqual({ user });
  });

  it("maps domain errors", async () => {
    const send = vi.fn();
    const reply = {
      code: vi.fn().mockReturnValue({ send }),
    };
    vi.mocked(users.getMe).mockRejectedValue(new UnauthorizedError());

    await controller.getMe(
      { user: { sub: "1", email: "a@b.com" } } as FastifyRequest,
      reply as never,
    );

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(send).toHaveBeenCalledWith({ error: "Unauthorized" });
  });
});
