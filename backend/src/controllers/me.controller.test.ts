import type { FastifyReply, FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { revokeSession } = vi.hoisted(() => ({ revokeSession: vi.fn() }));
vi.mock("../lib/session.js", () => ({
  COOKIE_NAME: "ft_token",
  sessionCookieOptions: () => ({}),
  revokeSession,
}));

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
    exportData: vi.fn(),
    deleteAccount: vi.fn(),
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
      autoCycle: false,
      longBreakMinutes: 15,
      pomodorosUntilLongBreak: 4,
      dailyFocusGoalMinutes: 0,
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
      autoCycle: false,
      longBreakMinutes: 15,
      pomodorosUntilLongBreak: 4,
      dailyFocusGoalMinutes: 0,
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

  it("exports the account data with a download header", async () => {
    const data = { exportedAt: "now", user: { id: "1" }, sessions: [] };
    vi.mocked(users.exportData).mockResolvedValue(data as never);
    const header = vi.fn();

    await expect(
      controller.exportData(
        { user: { sub: "1", email: "a@b.com" } } as FastifyRequest,
        { header } as never,
      ),
    ).resolves.toEqual(data);
    expect(header).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="focus-trail-export.json"',
    );
  });

  it("deletes the account, revokes the session and clears the cookie", async () => {
    vi.mocked(users.deleteAccount).mockResolvedValue(undefined);
    const send = vi.fn();
    const clearCookie = vi.fn();
    const reply = { send, clearCookie };

    await controller.deleteAccount(
      {
        user: { sub: "1", email: "a@b.com", jti: "jti-1" },
        body: { password: "password123" },
      } as FastifyRequest,
      reply as unknown as FastifyReply,
    );

    expect(users.deleteAccount).toHaveBeenCalledWith("1", "password123");
    expect(revokeSession).toHaveBeenCalledWith("jti-1");
    expect(clearCookie).toHaveBeenCalledWith("ft_token", {});
    expect(send).toHaveBeenCalledWith({ ok: true });
  });

  it("rejects account deletion without a password", async () => {
    const send = vi.fn();
    const reply = { code: vi.fn().mockReturnValue({ send }) };

    await controller.deleteAccount(
      { user: { sub: "1", email: "a@b.com" }, body: {} } as FastifyRequest,
      reply as unknown as FastifyReply,
    );

    expect(reply.code).toHaveBeenCalledWith(400);
    expect(users.deleteAccount).not.toHaveBeenCalled();
  });

  it("maps a wrong password on deletion to 401", async () => {
    vi.mocked(users.deleteAccount).mockRejectedValue(
      new InvalidCredentialsError(),
    );
    const send = vi.fn();
    const clearCookie = vi.fn();
    const reply = { send, clearCookie, code: vi.fn().mockReturnValue({ send }) };

    await controller.deleteAccount(
      {
        user: { sub: "1", email: "a@b.com", jti: "jti-1" },
        body: { password: "wrong-password" },
      } as FastifyRequest,
      reply as unknown as FastifyReply,
    );

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(clearCookie).not.toHaveBeenCalled();
  });
});
