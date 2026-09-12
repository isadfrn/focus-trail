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
  createdAt: string;
}

export interface NewSession {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  type: SessionType;
  completed: boolean;
}

export type DurationOp = "eq" | "gt" | "lt";

export interface SessionFilters {
  /** Intervalo ISO (o front converte a data escolhida no fuso local). */
  from?: string;
  to?: string;
  type?: SessionType;
  completed?: boolean;
  durationOp?: DurationOp;
  durationSeconds?: number;
}

export interface SessionsPage {
  sessions: PomodoroSession[];
  nextCursor: string | null;
}
