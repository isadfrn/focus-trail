import { storage } from "./platform/storage";
import type { Phase } from "./pomodoro-cycle";

const ACTIVE_KEY = "ft_timer_active";

export interface ActiveSession {
  phase: Phase;
  durationSec: number;
  startedAt: number;
  endTarget: number;
  completedFocus: number;
  taskLabel: string;
}

function isActiveSession(value: unknown): value is ActiveSession {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.phase === "string" &&
    typeof candidate.durationSec === "number" &&
    typeof candidate.startedAt === "number" &&
    typeof candidate.endTarget === "number" &&
    typeof candidate.completedFocus === "number" &&
    typeof candidate.taskLabel === "string"
  );
}

export function loadActiveSession(): ActiveSession | null {
  const raw = storage.get(ACTIVE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isActiveSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: ActiveSession): void {
  storage.set(ACTIVE_KEY, JSON.stringify(session));
}

export function clearActiveSession(): void {
  storage.remove(ACTIVE_KEY);
}

export function remainingSeconds(endTarget: number, now: number): number {
  return Math.max(0, Math.round((endTarget - now) / 1000));
}
