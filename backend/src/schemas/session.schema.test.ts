import { describe, expect, it } from "vitest";

import {
  createSessionSchema,
  listSessionsQuerySchema,
} from "./session.schema.js";

describe("createSessionSchema", () => {
  const valid = {
    startedAt: "2026-09-10T20:00:00.000Z",
    endedAt: "2026-09-10T20:25:00.000Z",
    durationSeconds: 1500,
    type: "focus" as const,
    completed: true,
  };

  it("accepts a valid session payload", () => {
    expect(createSessionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects when endedAt is before startedAt", () => {
    expect(
      createSessionSchema.safeParse({
        ...valid,
        endedAt: "2026-09-10T19:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid type", () => {
    expect(
      createSessionSchema.safeParse({
        ...valid,
        type: "nap",
      }).success,
    ).toBe(false);
  });
});

describe("listSessionsQuerySchema", () => {
  it("defaults the limit and coerces query strings", () => {
    const result = listSessionsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(20);
  });

  it("coerces limit and duration, and parses completed", () => {
    const result = listSessionsQuerySchema.safeParse({
      limit: "30",
      completed: "true",
      durationOp: "gt",
      durationSeconds: "600",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(30);
      expect(result.data.completed).toBe(true);
      expect(result.data.durationSeconds).toBe(600);
    }
  });

  it("rejects a limit above the max", () => {
    expect(listSessionsQuerySchema.safeParse({ limit: "500" }).success).toBe(
      false,
    );
  });

  it("requires durationOp and durationSeconds together", () => {
    expect(listSessionsQuerySchema.safeParse({ durationOp: "gt" }).success).toBe(
      false,
    );
    expect(
      listSessionsQuerySchema.safeParse({ durationSeconds: "600" }).success,
    ).toBe(false);
  });

  it("rejects an invalid type", () => {
    expect(listSessionsQuerySchema.safeParse({ type: "nap" }).success).toBe(
      false,
    );
  });
});
