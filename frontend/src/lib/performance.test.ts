import { describe, expect, it } from "vitest";

import type { DailyStat, StatsTotals } from "../types/session";
import {
  bestDay,
  completionRate,
  computeStreak,
  fillWindow,
  focusBreakRatio,
  sumWindow,
  todayProgress,
  utcDayKey,
  type DayTotals,
} from "./performance";

function dayTotals(
  date: string,
  focusSeconds: number,
  breakSeconds = 0,
): DayTotals {
  return { date, focusSeconds, breakSeconds };
}

function stat(date: string, overrides: Partial<DailyStat> = {}): DailyStat {
  return {
    date,
    focusSeconds: 1500,
    breakSeconds: 300,
    completedFocus: 1,
    interruptedFocus: 0,
    sessions: 2,
    ...overrides,
  };
}

describe("fillWindow", () => {
  it("returns exactly N days, filling gaps and putting today last", () => {
    const now = new Date("2026-09-20T12:00:00.000Z");
    const days = fillWindow([dayTotals("2026-09-20", 900)], 7, now);
    expect(days).toHaveLength(7);
    expect(days[6]).toEqual(dayTotals("2026-09-20", 900));
    expect(days[0].focusSeconds).toBe(0);
    expect(days[0].date).toBe("2026-09-14");
  });
});

describe("todayProgress", () => {
  const now = new Date("2026-09-20T12:00:00.000Z");

  it("measures today's focus against the goal", () => {
    const progress = todayProgress(
      [dayTotals("2026-09-20", 2400), dayTotals("2026-09-19", 3000)],
      60,
      now,
    );
    expect(progress.focusSeconds).toBe(2400);
    expect(progress.goalSeconds).toBe(3600);
    expect(progress.ratio).toBeCloseTo(2400 / 3600);
    expect(progress.reached).toBe(false);
  });

  it("caps the ratio and flags a reached goal", () => {
    const progress = todayProgress([dayTotals("2026-09-20", 7200)], 60, now);
    expect(progress.ratio).toBe(1);
    expect(progress.reached).toBe(true);
  });

  it("returns a zero ratio without a goal", () => {
    const progress = todayProgress([dayTotals("2026-09-20", 1500)], 0, now);
    expect(progress.goalSeconds).toBe(0);
    expect(progress.ratio).toBe(0);
    expect(progress.reached).toBe(false);
  });
});

describe("computeStreak", () => {
  const now = new Date("2026-09-20T12:00:00.000Z");
  const met = (date: string) => dayTotals(date, 3600);

  it("counts consecutive goal-meeting days including today", () => {
    expect(
      computeStreak(
        [met("2026-09-20"), met("2026-09-19"), met("2026-09-18")],
        60,
        now,
      ),
    ).toBe(3);
  });

  it("keeps the streak alive when today is not yet met", () => {
    expect(
      computeStreak([met("2026-09-19"), met("2026-09-18")], 60, now),
    ).toBe(2);
  });

  it("stops at the first gap before today", () => {
    expect(computeStreak([met("2026-09-20"), met("2026-09-18")], 60, now)).toBe(
      1,
    );
  });

  it("is zero without a goal", () => {
    expect(computeStreak([met("2026-09-20")], 0, now)).toBe(0);
  });
});

describe("derived metrics", () => {
  const totals: StatsTotals = {
    focusSeconds: 3000,
    breakSeconds: 600,
    completedFocus: 3,
    interruptedFocus: 1,
    sessions: 4,
  };

  it("computes the completion rate", () => {
    expect(completionRate(totals)).toBeCloseTo(0.75);
    expect(
      completionRate({ ...totals, completedFocus: 0, interruptedFocus: 0 }),
    ).toBe(0);
  });

  it("computes the focus:break ratio and guards zero breaks", () => {
    expect(focusBreakRatio(totals)).toBeCloseTo(5);
    expect(focusBreakRatio({ ...totals, breakSeconds: 0 })).toBeNull();
  });

  it("finds the best focus day, ignoring empty days", () => {
    expect(
      bestDay([
        dayTotals("2026-09-18", 600),
        dayTotals("2026-09-19", 0),
        dayTotals("2026-09-20", 1800),
      ])?.date,
    ).toBe("2026-09-20");
    expect(bestDay([dayTotals("2026-09-20", 0)])).toBeNull();
  });

  it("sums per-day stats into totals", () => {
    expect(
      sumWindow([
        stat("2026-09-19", { focusSeconds: 1500, breakSeconds: 300 }),
        stat("2026-09-20", {
          focusSeconds: 600,
          breakSeconds: 0,
          completedFocus: 0,
          interruptedFocus: 1,
          sessions: 1,
        }),
      ]),
    ).toEqual({
      focusSeconds: 2100,
      breakSeconds: 300,
      completedFocus: 1,
      interruptedFocus: 1,
      sessions: 3,
    });
  });
});

describe("utcDayKey", () => {
  it("formats a date as an ISO day", () => {
    expect(utcDayKey(new Date("2026-09-20T23:59:00.000Z"))).toBe("2026-09-20");
  });
});
