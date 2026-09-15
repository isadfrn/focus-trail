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

  it("stores and filters by the task label", async () => {
    const { cookie } = await registerUser();
    const created = await createSession(cookie, { taskLabel: "Estudar Prisma" });
    expect(created.statusCode).toBe(201);
    expect(created.json().session.taskLabel).toBe("Estudar Prisma");

    await createSession(cookie, {
      taskLabel: "Revisar PR",
      startedAt: "2026-09-11T10:00:00.000Z",
      endedAt: "2026-09-11T10:25:00.000Z",
    });

    const matched = await app.inject({
      method: "GET",
      url: "/api/sessions?task=prisma",
      headers: { cookie },
    });
    expect(matched.json().sessions).toHaveLength(1);
    expect(matched.json().sessions[0].taskLabel).toBe("Estudar Prisma");
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

  it("aggregates daily stats in the database", async () => {
    const { cookie } = await registerUser("stats-int@example.com");
    await createSession(cookie, {
      type: "focus",
      completed: true,
      durationSeconds: 1500,
      startedAt: "2026-09-10T09:00:00.000Z",
      endedAt: "2026-09-10T09:25:00.000Z",
    });
    await createSession(cookie, {
      type: "break",
      completed: true,
      durationSeconds: 300,
      startedAt: "2026-09-10T09:30:00.000Z",
      endedAt: "2026-09-10T09:35:00.000Z",
    });
    await createSession(cookie, {
      type: "focus",
      completed: false,
      durationSeconds: 600,
      startedAt: "2026-09-11T09:00:00.000Z",
      endedAt: "2026-09-11T09:10:00.000Z",
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/sessions/stats?from=2026-09-01T00:00:00.000Z",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.days).toHaveLength(2);
    expect(body.days[0]).toMatchObject({
      date: "2026-09-10",
      focusSeconds: 1500,
      breakSeconds: 300,
      completedFocus: 1,
      interruptedFocus: 0,
    });
    expect(body.totals).toMatchObject({
      focusSeconds: 2100,
      breakSeconds: 300,
      completedFocus: 1,
      interruptedFocus: 1,
      sessions: 3,
    });
  });
});

describe("LGPD export and account deletion (integration)", () => {
  it("exports the user with all their sessions", async () => {
    const { cookie } = await registerUser("export-int@example.com");
    await createSession(cookie, { taskLabel: "Exportavel" });

    const res = await app.inject({
      method: "GET",
      url: "/api/me/export",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-disposition"]).toContain(
      "focus-trail-export.json",
    );
    const body = res.json();
    expect(body.user.email).toBe("export-int@example.com");
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0].taskLabel).toBe("Exportavel");
    expect(typeof body.exportedAt).toBe("string");
  });

  it("rejects deletion with a wrong password and succeeds with the right one", async () => {
    const { cookie } = await registerUser("delete-int@example.com");
    await createSession(cookie);

    const wrong = await app.inject({
      method: "DELETE",
      url: "/api/me",
      headers: { cookie },
      payload: { password: "not-the-password" },
    });
    expect(wrong.statusCode).toBe(401);

    const ok = await app.inject({
      method: "DELETE",
      url: "/api/me",
      headers: { cookie },
      payload: { password: "password123" },
    });
    expect(ok.statusCode).toBe(200);

    const afterMe = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie },
    });
    expect(afterMe.statusCode).toBe(401);
  });
});
