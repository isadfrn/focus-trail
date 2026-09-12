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
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    deleteAll: vi.fn(),
  } as unknown as SessionService;

  const uuid = "11111111-1111-1111-1111-111111111111";

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

  it("lists sessions with a parsed query", async () => {
    const reply = createReply();
    const result = { sessions: [{ id: "s1" }], nextCursor: null };
    vi.mocked(sessions.list).mockResolvedValue(result as never);

    await expect(
      controller.list(
        {
          query: { limit: "20", type: "focus" },
          user: { sub: "u1", email: "a@b.com" },
        } as unknown as FastifyRequest,
        reply as never,
      ),
    ).resolves.toEqual(result);
    expect(sessions.list).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ limit: 20, type: "focus" }),
    );
  });

  it("rejects an invalid list query", async () => {
    const reply = createReply();
    // durationOp without durationSeconds fails the schema refine.
    await controller.list(
      {
        query: { durationOp: "gt" },
        user: { sub: "u1", email: "a@b.com" },
      } as unknown as FastifyRequest,
      reply as never,
    );
    expect(reply.code).toHaveBeenCalledWith(400);
    expect(sessions.list).not.toHaveBeenCalled();
  });

  it("rejects a delete with an invalid id", async () => {
    const reply = createReply();
    await controller.remove(
      { params: { id: "nope" }, user: { sub: "u1" } } as never,
      reply as never,
    );
    expect(reply.code).toHaveBeenCalledWith(400);
  });

  it("deletes one session", async () => {
    const reply = createReply();
    vi.mocked(sessions.deleteOne).mockResolvedValue(1 as never);
    await controller.remove(
      { params: { id: uuid }, user: { sub: "u1" } } as never,
      reply as never,
    );
    expect(sessions.deleteOne).toHaveBeenCalledWith("u1", uuid);
    expect(reply.send).toHaveBeenCalledWith({ deleted: 1 });
  });

  it("returns 404 when the session is not found", async () => {
    const reply = createReply();
    vi.mocked(sessions.deleteOne).mockResolvedValue(0 as never);
    await controller.remove(
      { params: { id: uuid }, user: { sub: "u1" } } as never,
      reply as never,
    );
    expect(reply.code).toHaveBeenCalledWith(404);
  });

  it("rejects a bulk delete with neither ids nor all", async () => {
    const reply = createReply();
    await controller.removeMany(
      { body: {}, user: { sub: "u1" } } as never,
      reply as never,
    );
    expect(reply.code).toHaveBeenCalledWith(400);
  });

  it("deletes selected sessions", async () => {
    const reply = createReply();
    vi.mocked(sessions.deleteMany).mockResolvedValue(2 as never);
    await controller.removeMany(
      { body: { ids: [uuid] }, user: { sub: "u1" } } as never,
      reply as never,
    );
    expect(sessions.deleteMany).toHaveBeenCalledWith("u1", [uuid]);
    expect(reply.send).toHaveBeenCalledWith({ deleted: 2 });
  });

  it("deletes all sessions", async () => {
    const reply = createReply();
    vi.mocked(sessions.deleteAll).mockResolvedValue(5 as never);
    await controller.removeMany(
      { body: { all: true }, user: { sub: "u1" } } as never,
      reply as never,
    );
    expect(sessions.deleteAll).toHaveBeenCalledWith("u1");
    expect(reply.send).toHaveBeenCalledWith({ deleted: 5 });
  });
});
