import { describe, expect, it } from "vitest";

import { createSessionSchema } from "./session.schema.js";

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
