import { useEffect, useState } from "react";

import { sessionApi } from "../api/session.api";
import {
  lastNDays,
  summarize,
  type DayTotals,
  type PerformanceSummary,
} from "../lib/performance";
import type { PomodoroSession } from "../types/session";

const DEFAULT_WINDOW_DAYS = 14;
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

interface UsePerformance {
  windowDays: number;
  days: DayTotals[];
  summary: PerformanceSummary;
  loading: boolean;
  error: string | null;
}

export function usePerformance(
  windowDays: number = DEFAULT_WINDOW_DAYS,
): UsePerformance {
  const [days, setDays] = useState<DayTotals[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary>({
    focusSeconds: 0,
    breakSeconds: 0,
    sessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const from = new Date();
      from.setHours(0, 0, 0, 0);
      from.setDate(from.getDate() - (windowDays - 1));

      try {
        const all: PomodoroSession[] = [];
        let cursor: string | undefined;
        for (let page = 0; page < MAX_PAGES; page++) {
          const result = await sessionApi.list({
            limit: PAGE_SIZE,
            cursor,
            filters: { from: from.toISOString() },
          });
          all.push(...result.sessions);
          if (!result.nextCursor) break;
          cursor = result.nextCursor;
        }
        if (cancelled) return;
        setDays(lastNDays(all, windowDays));
        setSummary(summarize(all));
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

  return { windowDays, days, summary, loading, error };
}
