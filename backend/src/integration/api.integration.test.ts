import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../app.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

function cookieFrom(headers: Record<string, unknown>): string {
  const raw = headers["set-cookie"];
  const value = Array.isArray(raw) ? raw[0] : (raw as string | undefined);
  if (!value) throw new Error("missing set-cookie");
  return value.split(";")[0] ?? value;
}

async function registerUser(
  email = "int@example.com",
  password = "password123",
) {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password },
  });
  return { res, cookie: cookieFrom(res.headers) };
}

async function createSession(
  cookie: string,
  overrides: Record<string, unknown> = {},
) {
  return app.inject({
    method: "POST",
    url: "/api/sessions",
    headers: { cookie },
    payload: {
      startedAt: "2026-09-10T20:00:00.000Z",
      endedAt: "2026-09-10T20:25:00.000Z",
      durationSeconds: 1500,
      type: "focus",
      completed: true,
      ...overrides,
    },
  });
}

describe("auth + me (integration)", () => {
  it("registers, reads me, and logs in", async () => {
    const { res, cookie } = await registerUser();
    expect(res.statusCode).toBe(201);

    const me = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user).toMatchObject({
      email: "int@example.com",
      focusMinutes: 25,
      breakMinutes: 5,
    });

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "int@example.com", password: "password123" },
    });
    expect(login.statusCode).toBe(200);

    const bad = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "int@example.com", password: "wrongpass123" },
    });
    expect(bad.statusCode).toBe(401);
  });

  it("rejects a duplicate registration", async () => {
    await registerUser();
    const dup = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "int@example.com", password: "password123" },
    });
    expect(dup.statusCode).toBe(409);
  });

  it("updates preferences and changes the password", async () => {
    const { cookie } = await registerUser();

    const patch = await app.inject({
      method: "PATCH",
      url: "/api/me",
      headers: { cookie },
      payload: { focusMinutes: 50, character: "luigi" },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().user).toMatchObject({
      focusMinutes: 50,
      character: "luigi",
    });

    const pw = await app.inject({
      method: "PATCH",
      url: "/api/me/password",
      headers: { cookie },
      payload: { currentPassword: "password123", newPassword: "newpassword456" },
    });
    expect(pw.statusCode).toBe(200);

    const relogin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "int@example.com", password: "newpassword456" },
    });
    expect(relogin.statusCode).toBe(200);
  });
});

describe("sessions (integration)", () => {
  it("paginates with a cursor", async () => {
    const { cookie } = await registerUser();
    for (let i = 0; i < 3; i++) {
      await createSession(cookie, {
        startedAt: `2026-09-1${i}T20:00:00.000Z`,
        endedAt: `2026-09-1${i}T20:25:00.000Z`,
      });
    }

    const first = await app.inject({
      method: "GET",
      url: "/api/sessions?limit=2",
      headers: { cookie },
    });
    const page1 = first.json();
    expect(page1.sessions).toHaveLength(2);
    expect(page1.nextCursor).toBeTruthy();

    const second = await app.inject({
      method: "GET",
      url: `/api/sessions?limit=2&cursor=${page1.nextCursor}`,
      headers: { cookie },
    });
    const page2 = second.json();
    expect(page2.sessions).toHaveLength(1);
    expect(page2.nextCursor).toBeNull();
  });

  it("filters by type, status and duration (combinable)", async () => {
    const { cookie } = await registerUser();
    await createSession(cookie, {
      type: "focus",
      completed: true,
      durationSeconds: 1500,
    });
    await createSession(cookie, {
      type: "break",
      completed: false,
      durationSeconds: 300,
      startedAt: "2026-09-11T10:00:00.000Z",
      endedAt: "2026-09-11T10:05:00.000Z",
    });

    const focus = await app.inject({
      method: "GET",
      url: "/api/sessions?type=focus",
      headers: { cookie },
    });
    expect(focus.json().sessions).toHaveLength(1);
    expect(focus.json().sessions[0].type).toBe("focus");

    const interrupted = await app.inject({
      method: "GET",
      url: "/api/sessions?completed=false",
      headers: { cookie },
    });
    expect(interrupted.json().sessions).toHaveLength(1);

    const short = await app.inject({
      method: "GET",
      url: "/api/sessions?durationOp=lt&durationSeconds=1000",
      headers: { cookie },
    });
    expect(short.json().sessions).toHaveLength(1);
    expect(short.json().sessions[0].durationSeconds).toBe(300);

    const combined = await app.inject({
      method: "GET",
      url: "/api/sessions?type=focus&completed=true&durationOp=gt&durationSeconds=1000",
      headers: { cookie },
    });
    expect(combined.json().sessions).toHaveLength(1);
  });

  it("scopes sessions to the owner and deletes all", async () => {
    const a = await registerUser("a-int@example.com");
    const b = await registerUser("b-int@example.com");
    await createSession(a.cookie);

    const listB = await app.inject({
      method: "GET",
      url: "/api/sessions",
      headers: { cookie: b.cookie },
    });
    expect(listB.json().sessions).toHaveLength(0);

    const listA = await app.inject({
      method: "GET",
      url: "/api/sessions",
      headers: { cookie: a.cookie },
    });
    expect(listA.json().sessions).toHaveLength(1);

    const del = await app.inject({
      method: "DELETE",
      url: "/api/sessions",
      headers: { cookie: a.cookie },
      payload: { all: true },
    });
    expect(del.json().deleted).toBe(1);
  });

  it("deletes a single session and a selected set", async () => {
    const { cookie } = await registerUser("del-int@example.com");
    const created: string[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await createSession(cookie, {
        startedAt: `2026-09-1${i}T20:00:00.000Z`,
        endedAt: `2026-09-1${i}T20:25:00.000Z`,
      });
      created.push(res.json().session.id);
    }

    const one = await app.inject({
      method: "DELETE",
      url: `/api/sessions/${created[0]}`,
      headers: { cookie },
    });
    expect(one.json().deleted).toBe(1);

    const many = await app.inject({
      method: "DELETE",
      url: "/api/sessions",
      headers: { cookie },
      payload: { ids: [created[1], created[2]] },
    });
    expect(many.json().deleted).toBe(2);

    const list = await app.inject({
      method: "GET",
      url: "/api/sessions",
      headers: { cookie },
    });
    expect(list.json().sessions).toHaveLength(0);
  });

  it("requires authentication", async () => {
    const res = await app.inject({ method: "GET", url: "/api/sessions" });
    expect(res.statusCode).toBe(401);
  });
});
