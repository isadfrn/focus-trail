import type { FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "../errors/app-error.js";
import type { SessionService } from "../services/session.service.js";
import { SessionController } from "./session.controller.js";

function createReply() {
  const reply = {
    code: vi.fn(),
    send: vi.fn(),
  };
  reply.code.mockReturnValue(reply);
  reply.send.mockReturnValue(reply);
  return reply;
}

describe("SessionController", () => {
  const sessions = {
    create: vi.fn(),
    list: vi.fn(),
  } as unknown as SessionService;

  const controller = new SessionController(sessions);

  const body = {
    startedAt: "2026-09-10T20:00:00.000Z",
    endedAt: "2026-09-10T20:25:00.000Z",
    durationSeconds: 1500,
    type: "focus",
    completed: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid create body", async () => {
    const reply = createReply();
    await controller.create({ body: {} } as FastifyRequest, reply as never);
    expect(reply.code).toHaveBeenCalledWith(400);
  });

  it("creates a session", async () => {
    const reply = createReply();
    const session = { id: "s1" };
    vi.mocked(sessions.create).mockResolvedValue(session as never);

    await controller.create(
      {
        body,
        user: { sub: "u1", email: "a@b.com" },
      } as FastifyRequest,
      reply as never,
    );

    expect(sessions.create).toHaveBeenCalledWith("u1", body);
    expect(reply.code).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({ session });
  });

  it("maps create domain errors", async () => {
    const reply = createReply();
    vi.mocked(sessions.create).mockRejectedValue(new UnauthorizedError());

    await controller.create(
      {
        body,
        user: { sub: "u1", email: "a@b.com" },
      } as FastifyRequest,
      reply as never,
    );

    expect(reply.code).toHaveBeenCalledWith(401);
  });

  it("lists sessions", async () => {
    vi.mocked(sessions.list).mockResolvedValue([{ id: "s1" }] as never);
    await expect(
      controller.list({
        user: { sub: "u1", email: "a@b.com" },
      } as FastifyRequest),
    ).resolves.toEqual({ sessions: [{ id: "s1" }] });
  });
});
