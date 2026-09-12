import { describe, expect, it } from "vitest";

import { sessionsQuery } from "./session.api";

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
