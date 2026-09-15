import { useEffect, useState } from "react";

import { sessionApi } from "../api/session.api";
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
  type TodayProgress,
} from "../lib/performance";
import type { DailyStat, StatsTotals } from "../types/session";

const DEFAULT_WINDOW_DAYS = 14;
const STREAK_WINDOW_DAYS = 60;

const EMPTY_TOTALS: StatsTotals = {
  focusSeconds: 0,
  breakSeconds: 0,
  completedFocus: 0,
  interruptedFocus: 0,
  sessions: 0,
};

const EMPTY_PROGRESS: TodayProgress = {
  focusSeconds: 0,
  goalSeconds: 0,
  ratio: 0,
  reached: false,
};

interface UsePerformance {
  windowDays: number;
  days: DayTotals[];
  totals: StatsTotals;
  completionRate: number;
  focusBreakRatio: number | null;
  bestDay: DayTotals | null;
  streak: number;
  today: TodayProgress;
  loading: boolean;
  error: string | null;
}

function startOfUtcDayBefore(days: number): Date {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

export function usePerformance(
  windowDays: number = DEFAULT_WINDOW_DAYS,
  goalMinutes: number = 0,
): UsePerformance {
  const [allDays, setAllDays] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const from = startOfUtcDayBefore(Math.max(windowDays, STREAK_WINDOW_DAYS));
      try {
        const result = await sessionApi.stats({ from: from.toISOString() });
        if (!cancelled) setAllDays(result.days);
      } catch {
        if (!cancelled) setError("Nao consegui carregar a performance.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [windowDays]);

  const windowStartKey = utcDayKey(startOfUtcDayBefore(windowDays));
  const windowStats = allDays.filter((day) => day.date >= windowStartKey);
  const days = fillWindow(windowStats, windowDays);
  const totals = windowStats.length > 0 ? sumWindow(windowStats) : EMPTY_TOTALS;

  return {
    windowDays,
    days,
    totals,
    completionRate: completionRate(totals),
    focusBreakRatio: focusBreakRatio(totals),
    bestDay: bestDay(windowStats),
    streak: computeStreak(allDays, goalMinutes),
    today:
      goalMinutes > 0 ? todayProgress(allDays, goalMinutes) : EMPTY_PROGRESS,
    loading,
    error,
  };
}
