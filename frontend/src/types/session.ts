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
