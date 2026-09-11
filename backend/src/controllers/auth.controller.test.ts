import type { FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConflictError } from "../errors/app-error.js";
import type { AuthService } from "../services/auth.service.js";
import { AuthController } from "./auth.controller.js";

vi.mock("../lib/session.js", () => ({
  COOKIE_NAME: "ft_token",
  issueSession: vi.fn(async () => undefined),
  sessionCookieOptions: vi.fn(() => ({ path: "/" })),
}));

import {
  issueSession,
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
    const user = { id: "1", email: "a@b.com", character: "mario" };
    vi.mocked(auth.register).mockResolvedValue(user);

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
    const user = { id: "1", email: "a@b.com", character: "mario" };
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

  it("clears cookie on logout", async () => {
    const reply = createReply();
    await controller.logout({} as FastifyRequest, reply as never);
    expect(reply.clearCookie).toHaveBeenCalledWith(
      "ft_token",
      sessionCookieOptions(),
    );
    expect(reply.send).toHaveBeenCalledWith({ ok: true });
  });
});
