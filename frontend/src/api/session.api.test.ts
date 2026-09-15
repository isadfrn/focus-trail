import { afterEach, describe, expect, it, vi } from "vitest";

import * as http from "../lib/http";
import { sessionApi, sessionsQuery, statsQuery } from "./session.api";

describe("sessionsQuery", () => {
  it("is empty with no params", () => {
    expect(sessionsQuery({})).toBe("");
  });

  it("serializes pagination params", () => {
    const qs = sessionsQuery({ limit: 20, cursor: "abc" });
    expect(qs).toContain("limit=20");
    expect(qs).toContain("cursor=abc");
    expect(qs.startsWith("?")).toBe(true);
  });

  it("serializes combined filters", () => {
    const qs = sessionsQuery({
      filters: {
        from: "2026-09-12T00:00:00.000Z",
        to: "2026-09-13T00:00:00.000Z",
        type: "focus",
        completed: false,
        durationOp: "gt",
        durationSeconds: 1500,
      },
    });
    const params = new URLSearchParams(qs);
    expect(params.get("type")).toBe("focus");
    expect(params.get("completed")).toBe("false");
    expect(params.get("durationOp")).toBe("gt");
    expect(params.get("durationSeconds")).toBe("1500");
    expect(params.get("from")).toBe("2026-09-12T00:00:00.000Z");
  });

  it("omits duration unless both op and value are present", () => {
    expect(sessionsQuery({ filters: { durationOp: "gt" } })).toBe("");
  });

  it("serializes the task filter", () => {
    const params = new URLSearchParams(
      sessionsQuery({ filters: { task: "relatorio" } }),
    );
    expect(params.get("task")).toBe("relatorio");
  });
});

describe("statsQuery", () => {
  it("is empty with no params", () => {
    expect(statsQuery({})).toBe("");
  });

  it("serializes the from/to range", () => {
    const params = new URLSearchParams(
      statsQuery({ from: "2026-09-01T00:00:00.000Z", to: "2026-09-10T00:00:00.000Z" }),
    );
    expect(params.get("from")).toBe("2026-09-01T00:00:00.000Z");
    expect(params.get("to")).toBe("2026-09-10T00:00:00.000Z");
  });
});

describe("sessionApi", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps each method to a verb and path", async () => {
    const request = vi.spyOn(http, "request").mockResolvedValue({} as never);

    await sessionApi.create({
      startedAt: "2026-09-13T00:00:00.000Z",
      endedAt: "2026-09-13T00:25:00.000Z",
      durationSeconds: 1500,
      type: "focus",
      completed: true,
    });
    await sessionApi.list({ limit: 20 });
    await sessionApi.stats({ from: "2026-09-01T00:00:00.000Z" });
    await sessionApi.remove("id-1");
    await sessionApi.removeMany(["id-1", "id-2"]);
    await sessionApi.removeAll();

    const paths = request.mock.calls.map((call) => call[0]);
    expect(paths.some((path) => path.startsWith("/sessions/stats"))).toBe(true);

    const calls = request.mock.calls;
    expect(calls[0][0]).toBe("/sessions");
    expect(calls[0][1]).toMatchObject({ method: "POST" });
    expect(calls[1][0]).toContain("/sessions");
    expect(calls[3][0]).toBe("/sessions/id-1");
    expect(calls[3][1]).toMatchObject({ method: "DELETE" });
  });
});
