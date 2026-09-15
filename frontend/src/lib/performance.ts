import type { DailyStat, StatsTotals } from "../types/session";

export type DayTotals = Pick<
  DailyStat,
  "date" | "focusSeconds" | "breakSeconds"
>;

export interface TodayProgress {
  focusSeconds: number;
  goalSeconds: number;
  ratio: number;
  reached: boolean;
}

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcMidnight(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function fillWindow(
  days: DayTotals[],
  windowDays: number,
  now: Date = new Date(),
): DayTotals[] {
  const byDay = new Map(days.map((day) => [day.date, day]));
  const result: DayTotals[] = [];
  const cursor = utcMidnight(now);
  cursor.setUTCDate(cursor.getUTCDate() - (windowDays - 1));
  for (let index = 0; index < windowDays; index++) {
    const key = utcDayKey(cursor);
    result.push(
      byDay.get(key) ?? { date: key, focusSeconds: 0, breakSeconds: 0 },
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

export function todayProgress(
  days: DayTotals[],
  goalMinutes: number,
  now: Date = new Date(),
): TodayProgress {
  const goalSeconds = Math.max(0, goalMinutes) * 60;
  const key = utcDayKey(now);
  const focusSeconds = days.find((day) => day.date === key)?.focusSeconds ?? 0;
  const ratio = goalSeconds > 0 ? Math.min(1, focusSeconds / goalSeconds) : 0;
  return {
    focusSeconds,
    goalSeconds,
    ratio,
    reached: goalSeconds > 0 && focusSeconds >= goalSeconds,
  };
}

export function computeStreak(
  days: DayTotals[],
  goalMinutes: number,
  now: Date = new Date(),
): number {
  const goalSeconds = Math.max(0, goalMinutes) * 60;
  if (goalSeconds <= 0) return 0;

  const focusByDay = new Map(days.map((day) => [day.date, day.focusSeconds]));
  const meets = (date: Date): boolean =>
    (focusByDay.get(utcDayKey(date)) ?? 0) >= goalSeconds;

  const cursor = utcMidnight(now);
  let streak = 0;
  if (meets(cursor)) streak += 1;
  cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (meets(cursor)) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function completionRate(totals: StatsTotals): number {
  const finished = totals.completedFocus + totals.interruptedFocus;
  return finished > 0 ? totals.completedFocus / finished : 0;
}

export function focusBreakRatio(totals: StatsTotals): number | null {
  return totals.breakSeconds > 0
    ? totals.focusSeconds / totals.breakSeconds
    : null;
}

export function bestDay(days: DayTotals[]): DayTotals | null {
  let best: DayTotals | null = null;
  for (const day of days) {
    if (day.focusSeconds <= 0) continue;
    if (!best || day.focusSeconds > best.focusSeconds) best = day;
  }
  return best;
}

export function sumWindow(days: DailyStat[]): StatsTotals {
  return days.reduce<StatsTotals>(
    (acc, day) => ({
      focusSeconds: acc.focusSeconds + day.focusSeconds,
      breakSeconds: acc.breakSeconds + day.breakSeconds,
      completedFocus: acc.completedFocus + day.completedFocus,
      interruptedFocus: acc.interruptedFocus + day.interruptedFocus,
      sessions: acc.sessions + day.sessions,
    }),
    {
      focusSeconds: 0,
      breakSeconds: 0,
      completedFocus: 0,
      interruptedFocus: 0,
      sessions: 0,
    },
  );
}
