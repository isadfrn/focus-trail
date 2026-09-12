import type { FastifyReply, FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  InvalidCredentialsError,
  UnauthorizedError,
} from "../errors/app-error.js";
import type { UserService } from "../services/user.service.js";
import { MeController } from "./me.controller.js";

describe("MeController", () => {
  const users = {
    getMe: vi.fn(),
    updatePreferences: vi.fn(),
    changePassword: vi.fn(),
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
      focusMinutes: 25,
      breakMinutes: 5,
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

  it("updates preferences with a valid body", async () => {
    const user = {
      id: "1",
      email: "a@b.com",
      character: "luigi",
      focusMinutes: 40,
      breakMinutes: 8,
      createdAt: new Date(),
    };
    vi.mocked(users.updatePreferences).mockResolvedValue(user);

    await expect(
      controller.updatePreferences(
        {
          user: { sub: "1", email: "a@b.com" },
          body: { character: "luigi", focusMinutes: 40, breakMinutes: 8 },
        } as FastifyRequest,
        { code: vi.fn() } as never,
      ),
    ).resolves.toEqual({ user });
    expect(users.updatePreferences).toHaveBeenCalledWith("1", {
      character: "luigi",
      focusMinutes: 40,
      breakMinutes: 8,
    });
  });

  it("rejects an empty preferences body", async () => {
    const send = vi.fn();
    const reply = { code: vi.fn().mockReturnValue({ send }) };

    await controller.updatePreferences(
      { user: { sub: "1", email: "a@b.com" }, body: {} } as FastifyRequest,
      reply as unknown as FastifyReply,
    );

    expect(reply.code).toHaveBeenCalledWith(400);
    expect(users.updatePreferences).not.toHaveBeenCalled();
  });

  it("rejects an invalid focus value", async () => {
    const send = vi.fn();
    const reply = { code: vi.fn().mockReturnValue({ send }) };

    await controller.updatePreferences(
      {
        user: { sub: "1", email: "a@b.com" },
        body: { focusMinutes: 0 },
      } as FastifyRequest,
      reply as unknown as FastifyReply,
    );

    expect(reply.code).toHaveBeenCalledWith(400);
    expect(users.updatePreferences).not.toHaveBeenCalled();
  });

  it("changes the password with a valid body", async () => {
    vi.mocked(users.changePassword).mockResolvedValue(undefined);

    await expect(
      controller.changePassword(
        {
          user: { sub: "1", email: "a@b.com" },
          body: {
            currentPassword: "currentpass1",
            newPassword: "newpassword1",
          },
        } as FastifyRequest,
        { code: vi.fn() } as never,
      ),
    ).resolves.toEqual({ ok: true });
    expect(users.changePassword).toHaveBeenCalledWith("1", {
      currentPassword: "currentpass1",
      newPassword: "newpassword1",
    });
  });

  it("rejects a weak new password", async () => {
    const send = vi.fn();
    const reply = { code: vi.fn().mockReturnValue({ send }) };

    await controller.changePassword(
      {
        user: { sub: "1", email: "a@b.com" },
        body: { currentPassword: "currentpass1", newPassword: "short" },
      } as FastifyRequest,
      reply as unknown as FastifyReply,
    );

    expect(reply.code).toHaveBeenCalledWith(400);
    expect(users.changePassword).not.toHaveBeenCalled();
  });

  it("maps a wrong current password to 401", async () => {
    const send = vi.fn();
    const reply = { code: vi.fn().mockReturnValue({ send }) };
    vi.mocked(users.changePassword).mockRejectedValue(
      new InvalidCredentialsError(),
    );

    await controller.changePassword(
      {
        user: { sub: "1", email: "a@b.com" },
        body: {
          currentPassword: "wrongpass1",
          newPassword: "newpassword1",
        },
      } as FastifyRequest,
      reply as unknown as FastifyReply,
    );

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(send).toHaveBeenCalledWith({ error: "Invalid Credentials" });
  });
});
