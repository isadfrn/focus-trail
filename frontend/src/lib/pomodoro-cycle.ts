import type { SessionType } from "../types/session";

export type Phase = "focus" | "shortBreak" | "longBreak";

export interface CyclePrefs {
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
}

export function phaseType(phase: Phase): SessionType {
  return phase === "focus" ? "focus" : "break";
}

export function phaseMinutes(phase: Phase, prefs: CyclePrefs): number {
  if (phase === "focus") return prefs.focusMinutes;
  if (phase === "longBreak") return prefs.longBreakMinutes;
  return prefs.breakMinutes;
}

export function nextPhase(
  finished: SessionType,
  completedFocus: number,
  pomodorosUntilLongBreak: number,
): Phase {
  if (finished === "break") return "focus";
  const dueForLongBreak =
    pomodorosUntilLongBreak > 0 &&
    completedFocus % pomodorosUntilLongBreak === 0;
  return dueForLongBreak ? "longBreak" : "shortBreak";
}
