import { afterEach, describe, expect, it, vi } from "vitest";

import * as http from "../lib/http";
import { sessionApi, sessionsQuery } from "./session.api";

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
    await sessionApi.remove("id-1");
    await sessionApi.removeMany(["id-1", "id-2"]);
    await sessionApi.removeAll();

    const calls = request.mock.calls;
    expect(calls[0][0]).toBe("/sessions");
    expect(calls[0][1]).toMatchObject({ method: "POST" });
    expect(calls[1][0]).toContain("/sessions");
    expect(calls[2][0]).toBe("/sessions/id-1");
    expect(calls[2][1]).toMatchObject({ method: "DELETE" });
    expect(calls[3][0]).toBe("/sessions");
    expect(calls[3][1]).toMatchObject({ method: "DELETE" });
    expect(calls[4][1]).toMatchObject({ method: "DELETE" });
  });
});
