import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    authSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    pomodoroSession: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "./prisma.js";
import { buildApp } from "./app.js";

function cookieFromSetCookie(header: string | string[] | undefined): string {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) throw new Error("missing set-cookie");
  return value.split(";")[0] ?? value;
}

describe("buildApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes health and hides docs by default in test", async () => {
    const app = await buildApp();

    const health = await app.inject({ method: "GET", url: "/api/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok" });

    const docs = await app.inject({ method: "GET", url: "/docs" });
    expect(docs.statusCode).toBe(404);

    await app.close();
  });

  it("rejects unauthenticated me and sessions", async () => {
    const app = await buildApp();

    const me = await app.inject({ method: "GET", url: "/api/me" });
    expect(me.statusCode).toBe(401);

    const sessions = await app.inject({ method: "GET", url: "/api/sessions" });
    expect(sessions.statusCode).toBe(401);

    await app.close();
  });

  it("registers login, register and logout routes", async () => {
    const app = await buildApp();

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "bad", password: "x" },
    });
    expect(login.statusCode).toBe(400);

    const register = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "bad", password: "x" },
    });
    expect(register.statusCode).toBe(400);

    const createSession = await app.inject({
      method: "POST",
      url: "/api/sessions",
      payload: {},
    });
    expect(createSession.statusCode).toBe(401);

    const logout = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
    });
    expect(logout.statusCode).toBe(200);
    expect(logout.json()).toEqual({ ok: true });

    await app.close();
  });

  it("issues a session cookie and revokes it on logout", async () => {
    const app = await buildApp();
    const userId = "11111111-1111-1111-1111-111111111111";
    const sessionId = "22222222-2222-2222-2222-222222222222";

    vi.mocked(prisma.user.findUnique).mockImplementation((args) => {
      if (args?.where && "email" in args.where) {
        return Promise.resolve(null) as never;
      }
      return Promise.resolve({
        id: userId,
        email: "user@example.com",
        character: "mario",
        createdAt: new Date(),
      }) as never;
    });
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: userId,
      email: "user@example.com",
      character: "mario",
    } as never);
    vi.mocked(prisma.authSession.create).mockResolvedValue({
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(prisma.authSession.findFirst).mockResolvedValue({
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(prisma.authSession.updateMany).mockResolvedValue({ count: 1 });

    const register = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "user@example.com", password: "password123" },
    });
    expect(register.statusCode).toBe(201);

    const cookie = cookieFromSetCookie(register.headers["set-cookie"]);

    const me = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({
      user: { id: userId, email: "user@example.com" },
    });

    const logout = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: { cookie },
    });
    expect(logout.statusCode).toBe(200);
    expect(prisma.authSession.updateMany).toHaveBeenCalled();

    vi.mocked(prisma.authSession.findFirst).mockResolvedValue(null);

    const meAfterLogout = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie },
    });
    expect(meAfterLogout.statusCode).toBe(401);

    await app.close();
  });

  it("lists sessions for an authenticated cookie", async () => {
    const app = await buildApp();
    const userId = "11111111-1111-1111-1111-111111111111";
    const sessionId = "22222222-2222-2222-2222-222222222222";

    vi.mocked(prisma.user.findUnique).mockImplementation((args) => {
      if (args?.where && "email" in args.where) {
        return Promise.resolve(null) as never;
      }
      return Promise.resolve({
        id: userId,
        email: "user@example.com",
        character: "mario",
        createdAt: new Date(),
      }) as never;
    });
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: userId,
      email: "user@example.com",
      character: "mario",
    } as never);
    vi.mocked(prisma.authSession.create).mockResolvedValue({
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(prisma.authSession.findFirst).mockResolvedValue({
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(prisma.pomodoroSession.findMany).mockResolvedValue([]);

    const register = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "list@example.com", password: "password123" },
    });
    const cookie = cookieFromSetCookie(register.headers["set-cookie"]);

    const list = await app.inject({
      method: "GET",
      url: "/api/sessions",
      headers: { cookie },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toEqual({ sessions: [], nextCursor: null });

    await app.close();
  });

  it("ignores Authorization bearer and requires cookie session", async () => {
    const app = await buildApp();
    const denied = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { authorization: "Bearer not-a-real-token" },
    });
    expect(denied.statusCode).toBe(401);
    await app.close();
  });
});
