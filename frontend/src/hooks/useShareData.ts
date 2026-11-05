import { useEffect, useState } from "react";

import { sessionApi } from "../api/session.api";
import i18next from "../i18n";
import { computeStreak } from "../lib/performance";
import { localDayRange } from "../lib/share/day-window";
import type { TaskSummary } from "../types/session";

const TASK_LIMIT = 50;
const STREAK_WINDOW_DAYS = 60;
const MS_PER_DAY = 86_400_000;

export interface DayShareData {
  focusSeconds: number;
  completedFocus: number;
  interruptedFocus: number;
  streak: number;
}

interface UseShareDataParams {
  enabled: boolean;
  date: Date;
  goalMinutes: number;
}

interface UseShareData {
  day: DayShareData | null;
  tasks: TaskSummary[];
  loading: boolean;
  error: string | null;
}

export function useShareData({
  enabled,
  date,
  goalMinutes,
}: UseShareDataParams): UseShareData {
  const [day, setDay] = useState<DayShareData | null>(null);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayStart = localDayRange(date).from.getTime();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const range = localDayRange(new Date(dayStart));
      const isToday = dayStart === localDayRange(new Date()).from.getTime();
      const streakFrom = new Date(Date.now() - STREAK_WINDOW_DAYS * MS_PER_DAY);

      try {
        const [dayStats, taskList, streakStats] = await Promise.all([
          sessionApi.stats({
            from: range.from.toISOString(),
            to: range.to.toISOString(),
          }),
          sessionApi.tasks({ limit: TASK_LIMIT }),
          goalMinutes > 0 && isToday
            ? sessionApi.stats({ from: streakFrom.toISOString() })
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setDay({
          focusSeconds: dayStats.totals.focusSeconds,
          completedFocus: dayStats.totals.completedFocus,
          interruptedFocus: dayStats.totals.interruptedFocus,
          streak: streakStats ? computeStreak(streakStats.days, goalMinutes) : 0,
        });
        setTasks(taskList.tasks);
      } catch {
        if (!cancelled) setError(i18next.t("loadErrors.shareData"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, dayStart, goalMinutes]);

  return { day, tasks, loading, error };
}
