import type { PomodoroSession } from "../types/session";

export interface DayTotals {
  date: string;
  focusSeconds: number;
  breakSeconds: number;
}

export interface PerformanceSummary {
  focusSeconds: number;
  breakSeconds: number;
  sessions: number;
}

function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function aggregateByDay(sessions: PomodoroSession[]): DayTotals[] {
  const byDay = new Map<string, DayTotals>();
  for (const session of sessions) {
    const key = dayKey(new Date(session.startedAt));
    const entry = byDay.get(key) ?? {
      date: key,
      focusSeconds: 0,
      breakSeconds: 0,
    };
    if (session.type === "focus") entry.focusSeconds += session.durationSeconds;
    else entry.breakSeconds += session.durationSeconds;
    byDay.set(key, entry);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function summarize(sessions: PomodoroSession[]): PerformanceSummary {
  let focusSeconds = 0;
  let breakSeconds = 0;
  for (const session of sessions) {
    if (session.type === "focus") focusSeconds += session.durationSeconds;
    else breakSeconds += session.durationSeconds;
  }
  return { focusSeconds, breakSeconds, sessions: sessions.length };
}

export function lastNDays(
  sessions: PomodoroSession[],
  days: number,
  now: Date = new Date(),
): DayTotals[] {
  const byDay = new Map(aggregateByDay(sessions).map((d) => [d.date, d]));
  const result: DayTotals[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = dayKey(cursor);
    result.push(
      byDay.get(key) ?? { date: key, focusSeconds: 0, breakSeconds: 0 },
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}
