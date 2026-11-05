import { currentLanguageTag } from "../i18n";

export function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

/** Human-friendly duration like `25min 0s` (history rows). */
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}min ${s}s` : `${s}s`;
}

/** Short localized date + time (history rows). */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(currentLanguageTag(), {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat(currentLanguageTag(), {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

export function formatRatio(value: number): string {
  const formatted = new Intl.NumberFormat(currentLanguageTag(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
  return `${formatted}:1`;
}
