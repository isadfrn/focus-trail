import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/session.api", () => ({
  sessionApi: { stats: vi.fn() },
}));

import { sessionApi } from "../api/session.api";
import { utcDayKey } from "../lib/performance";
import type { DailyStat, SessionStats } from "../types/session";
import { usePerformance } from "./usePerformance";

function day(date: string, overrides: Partial<DailyStat> = {}): DailyStat {
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

function stats(days: DailyStat[]): SessionStats {
  return {
    days,
    totals: {
      focusSeconds: 0,
      breakSeconds: 0,
      completedFocus: 0,
      interruptedFocus: 0,
      sessions: 0,
    },
  };
}

const todayKey = utcDayKey(new Date());

afterEach(() => vi.clearAllMocks());

describe("usePerformance", () => {
  it("builds the chart window and totals from the stats endpoint", async () => {
    vi.mocked(sessionApi.stats).mockResolvedValue(
      stats([day(todayKey, { focusSeconds: 1500, breakSeconds: 300 })]),
    );
    const { result } = renderHook(() => usePerformance(14));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.days).toHaveLength(14);
    expect(result.current.totals.focusSeconds).toBe(1500);
    expect(result.current.totals.breakSeconds).toBe(300);
    expect(result.current.days[13].focusSeconds).toBe(1500);
  });

  it("derives completion rate, focus:break ratio and best day", async () => {
    vi.mocked(sessionApi.stats).mockResolvedValue(
      stats([
        day(todayKey, {
          focusSeconds: 3000,
          breakSeconds: 600,
          completedFocus: 3,
          interruptedFocus: 1,
          sessions: 4,
        }),
      ]),
    );
    const { result } = renderHook(() => usePerformance(7));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.completionRate).toBeCloseTo(0.75);
    expect(result.current.focusBreakRatio).toBeCloseTo(5);
    expect(result.current.bestDay?.date).toBe(todayKey);
  });

  it("computes the streak and today's progress against the goal", async () => {
    vi.mocked(sessionApi.stats).mockResolvedValue(
      stats([day(todayKey, { focusSeconds: 1200 })]),
    );
    const { result } = renderHook(() => usePerformance(14, 20));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.today.focusSeconds).toBe(1200);
    expect(result.current.today.reached).toBe(true);
    expect(result.current.streak).toBe(1);
  });

  it("reports an error when loading fails", async () => {
    vi.mocked(sessionApi.stats).mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => usePerformance());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });
});
