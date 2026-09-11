import { describe, expect, it, vi } from "vitest";

vi.mock("../prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    pomodoroSession: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { buildApp } from "./app.js";

describe("buildApp", () => {
  it("exposes health and docs", async () => {
    const app = await buildApp();

    const health = await app.inject({ method: "GET", url: "/api/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok" });

    const docs = await app.inject({ method: "GET", url: "/docs" });
    expect(docs.statusCode).toBe(200);

    const openapi = await app.inject({ method: "GET", url: "/docs/json" });
    expect(openapi.statusCode).toBe(200);
    expect(openapi.json()).toMatchObject({
      info: { title: "Focus Trail API" },
    });

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
});
