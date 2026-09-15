export type SessionType = "focus" | "break";

export interface PomodoroSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  type: SessionType;
  completed: boolean;
  character: string;
  taskLabel: string | null;
  createdAt: string;
}

export interface NewSession {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  type: SessionType;
  completed: boolean;
  taskLabel?: string;
}

export type DurationOp = "eq" | "gt" | "lt";

export interface SessionFilters {
  from?: string;
  to?: string;
  type?: SessionType;
  task?: string;
  completed?: boolean;
  durationOp?: DurationOp;
  durationSeconds?: number;
}

export interface SessionsPage {
  sessions: PomodoroSession[];
  nextCursor: string | null;
}

export interface DailyStat {
  date: string;
  focusSeconds: number;
  breakSeconds: number;
  completedFocus: number;
  interruptedFocus: number;
  sessions: number;
}

export interface StatsTotals {
  focusSeconds: number;
  breakSeconds: number;
  completedFocus: number;
  interruptedFocus: number;
  sessions: number;
}

export interface SessionStats {
  days: DailyStat[];
  totals: StatsTotals;
}
