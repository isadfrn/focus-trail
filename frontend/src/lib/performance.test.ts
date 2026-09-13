import { describe, expect, it } from "vitest";

import type { PomodoroSession } from "../types/session";
import { aggregateByDay, lastNDays, summarize } from "./performance";

function makeSession(overrides: Partial<PomodoroSession>): PomodoroSession {
  return {
    id: "s",
    userId: "u",
    startedAt: "2026-09-10T12:00:00.000Z",
    endedAt: "2026-09-10T12:25:00.000Z",
    durationSeconds: 1500,
    type: "focus",
    completed: true,
    character: "mario-world",
    createdAt: "2026-09-10T12:25:00.000Z",
    ...overrides,
  };
}

function isoOf(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month, day, hour, 0, 0).toISOString();
}

describe("performance", () => {
  it("summarizes focus and break totals and session count", () => {
    const summary = summarize([
      makeSession({ type: "focus", durationSeconds: 1500 }),
      makeSession({ type: "break", durationSeconds: 300 }),
      makeSession({ type: "focus", durationSeconds: 600 }),
    ]);
    expect(summary).toEqual({
      focusSeconds: 2100,
      breakSeconds: 300,
      sessions: 3,
    });
  });

  it("aggregates sessions per local day", () => {
    const days = aggregateByDay([
      makeSession({ startedAt: isoOf(2026, 8, 20), type: "focus", durationSeconds: 1500 }),
      makeSession({ startedAt: isoOf(2026, 8, 20), type: "break", durationSeconds: 300 }),
      makeSession({ startedAt: isoOf(2026, 8, 22), type: "focus", durationSeconds: 600 }),
    ]);
    expect(days).toHaveLength(2);
    expect(days[0].focusSeconds).toBe(1500);
    expect(days[0].breakSeconds).toBe(300);
    expect(days[1].focusSeconds).toBe(600);
  });

  it("returns exactly N days, filling gaps with zeros and putting today last", () => {
    const now = new Date(2026, 8, 20, 12, 0, 0);
    const days = lastNDays(
      [makeSession({ startedAt: isoOf(2026, 8, 20, 10), type: "focus", durationSeconds: 900 })],
      7,
      now,
    );
    expect(days).toHaveLength(7);
    expect(days[6].focusSeconds).toBe(900);
    expect(days[0].focusSeconds).toBe(0);
    expect(days[0].breakSeconds).toBe(0);
  });
});
