import type { SessionType } from "../types/session";

export const MAX_MINUTES_BY_TYPE: Record<SessionType, number> = {
  focus: 180,
  break: 60,
};

export function parseMinutes(raw: string, maxMinutes: number): number | null {
  const value = Number(raw.trim());
  if (raw.trim() === "") return null;
  if (!Number.isInteger(value) || value < 1 || value > maxMinutes) return null;
  return value;
}
