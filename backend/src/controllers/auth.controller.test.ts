import type { FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConflictError, InvalidCodeError } from "../errors/app-error.js";
import type { AuthService } from "../services/auth.service.js";
import { AuthController } from "./auth.controller.js";

vi.mock("../lib/session.js", () => ({
  COOKIE_NAME: "ft_token",
  issueSession: vi.fn(async () => undefined),
  revokeSession: vi.fn(async () => undefined),
  sessionCookieOptions: vi.fn(() => ({ path: "/" })),
}));

import {
  issueSession,
  revokeSession,
  sessionCookieOptions,
} from "../lib/session.js";

function createReply() {
  const reply = {
    code: vi.fn(),
    send: vi.fn(),
    clearCookie: vi.fn(),
  };
  reply.code.mockReturnValue(reply);
  reply.send.mockReturnValue(reply);
  return reply;
}

describe("AuthController", () => {
  const auth = {
    register: vi.fn(),
    login: vi.fn(),
    sendEmailVerification: vi.fn(),
    verifyEmail: vi.fn(),
    resendEmailVerification: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
  } as unknown as AuthService;

  const controller = new AuthController(auth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid register body", async () => {
    const reply = createReply();
    await controller.register({ body: {} } as FastifyRequest, reply as never);
    expect(reply.code).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({ error: "Invalid Body" });
  });

  it("registers and issues session", async () => {
    const reply = createReply();
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
    vi.mocked(auth.register).mockResolvedValue({
      user,
      verificationRequired: false,
    });

    await controller.register(
      {
        body: { email: "a@b.com", password: "password123" },
      } as FastifyRequest,
      reply as never,
    );

    expect(issueSession).toHaveBeenCalledWith(reply, {
      sub: "1",
      email: "a@b.com",
    });
    expect(reply.code).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({ user });
  });

  it("returns 202 and sends a code when verification is required", async () => {
    const reply = createReply();
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
    vi.mocked(auth.register).mockResolvedValue({
      user,
      verificationRequired: true,
    });
    vi.mocked(auth.sendEmailVerification).mockResolvedValue(undefined);

    await controller.register(
      {
        body: { email: "a@b.com", password: "password123" },
        log: { error: vi.fn() },
      } as unknown as FastifyRequest,
      reply as never,
    );

    expect(auth.sendEmailVerification).toHaveBeenCalledWith(user);
    expect(issueSession).not.toHaveBeenCalled();
    expect(reply.code).toHaveBeenCalledWith(202);
    expect(reply.send).toHaveBeenCalledWith({
      verificationRequired: true,
      email: "a@b.com",
    });
  });

  it("verifies email and issues a session", async () => {
    const reply = createReply();
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
    vi.mocked(auth.verifyEmail).mockResolvedValue(user);

    await controller.verifyEmail(
      { body: { email: "a@b.com", code: "123456" } } as FastifyRequest,
      reply as never,
    );

    expect(auth.verifyEmail).toHaveBeenCalledWith("a@b.com", "123456");
    expect(issueSession).toHaveBeenCalled();
    expect(reply.send).toHaveBeenCalledWith({ user });
  });

  it("rejects an invalid verify-email body", async () => {
    const reply = createReply();
    await controller.verifyEmail(
      { body: { email: "a@b.com", code: "12" } } as FastifyRequest,
      reply as never,
    );
    expect(reply.code).toHaveBeenCalledWith(400);
    expect(auth.verifyEmail).not.toHaveBeenCalled();
  });

  it("always returns ok for forgot-password (no enumeration)", async () => {
    const reply = createReply();
    vi.mocked(auth.requestPasswordReset).mockResolvedValue(undefined);

    await controller.forgotPassword(
      {
        body: { email: "a@b.com" },
        log: { error: vi.fn() },
      } as unknown as FastifyRequest,
      reply as never,
    );

    expect(auth.requestPasswordReset).toHaveBeenCalledWith("a@b.com");
    expect(reply.send).toHaveBeenCalledWith({ ok: true });
  });

  it("resets the password with a valid body", async () => {
    const reply = createReply();
    vi.mocked(auth.resetPassword).mockResolvedValue(undefined);

    await controller.resetPassword(
      {
        body: {
          email: "a@b.com",
          code: "123456",
          newPassword: "newpassword1",
        },
      } as FastifyRequest,
      reply as never,
    );

    expect(auth.resetPassword).toHaveBeenCalledWith(
      "a@b.com",
      "123456",
      "newpassword1",
    );
    expect(reply.send).toHaveBeenCalledWith({ ok: true });
  });

  it("maps a bad reset code to 400", async () => {
    const reply = createReply();
    vi.mocked(auth.resetPassword).mockRejectedValue(new InvalidCodeError());

    await controller.resetPassword(
      {
        body: {
          email: "a@b.com",
          code: "123456",
          newPassword: "newpassword1",
        },
      } as FastifyRequest,
      reply as never,
    );

    expect(reply.code).toHaveBeenCalledWith(400);
  });

  it("maps register domain errors", async () => {
    const reply = createReply();
    vi.mocked(auth.register).mockRejectedValue(new ConflictError());

    await controller.register(
      {
        body: { email: "a@b.com", password: "password123" },
      } as FastifyRequest,
      reply as never,
    );

    expect(reply.code).toHaveBeenCalledWith(409);
  });

  it("rejects invalid login body", async () => {
    const reply = createReply();
    await controller.login({ body: {} } as FastifyRequest, reply as never);
    expect(reply.code).toHaveBeenCalledWith(400);
  });

  it("logs in and issues session", async () => {
    const reply = createReply();
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
    vi.mocked(auth.login).mockResolvedValue(user);

    await controller.login(
      {
        body: { email: "a@b.com", password: "password123" },
      } as FastifyRequest,
      reply as never,
    );

    expect(issueSession).toHaveBeenCalled();
    expect(reply.send).toHaveBeenCalledWith({ user });
  });

  it("maps login domain errors", async () => {
    const reply = createReply();
    vi.mocked(auth.login).mockRejectedValue(new ConflictError());

    await controller.login(
      {
        body: { email: "a@b.com", password: "password123" },
      } as FastifyRequest,
      reply as never,
    );

    expect(reply.code).toHaveBeenCalledWith(409);
  });

  it("revokes session and clears cookie on logout", async () => {
    const reply = createReply();
    const request = {
      jwtVerify: vi.fn().mockResolvedValue(undefined),
      user: { sub: "1", email: "a@b.com", jti: "session-1" },
    };

    await controller.logout(request as never, reply as never);

    expect(request.jwtVerify).toHaveBeenCalled();
    expect(revokeSession).toHaveBeenCalledWith("session-1");
    expect(reply.clearCookie).toHaveBeenCalledWith(
      "ft_token",
      sessionCookieOptions(),
    );
    expect(reply.send).toHaveBeenCalledWith({ ok: true });
  });

  it("clears cookie even when jwt verify fails", async () => {
    const reply = createReply();
    const request = {
      jwtVerify: vi.fn().mockRejectedValue(new Error("invalid")),
      user: undefined,
    };

    await controller.logout(request as never, reply as never);

    expect(revokeSession).not.toHaveBeenCalled();
    expect(reply.clearCookie).toHaveBeenCalled();
    expect(reply.send).toHaveBeenCalledWith({ ok: true });
  });
});
