import { formatDuration } from "../../lib/format";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { usePerformance } from "../../hooks/usePerformance";
import type { DayTotals } from "../../lib/performance";

const card =
  "flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 shadow-app";

function shortLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

function barHeight(value: number, max: number): string {
  if (value <= 0) return "0%";
  return `${Math.max(4, Math.round((value / max) * 100))}%`;
}

function Chart({ days }: { days: DayTotals[] }) {
  const max = Math.max(
    1,
    ...days.map((d) => Math.max(d.focusSeconds, d.breakSeconds)),
  );

  return (
    <div className="flex h-48 items-end gap-1.5">
      {days.map((day) => (
        <div
          key={day.date}
          className="flex min-w-0 flex-1 flex-col items-center gap-1"
          title={`${shortLabel(day.date)} — foco ${formatDuration(day.focusSeconds)}, pausa ${formatDuration(day.breakSeconds)}`}
        >
          <div className="flex h-full w-full items-end justify-center gap-1">
            <div
              className="w-2 rounded-t bg-primary"
              style={{ height: barHeight(day.focusSeconds, max) }}
            />
            <div
              className="w-2 rounded-t bg-sandy-brown-400"
              style={{ height: barHeight(day.breakSeconds, max) }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted">
            {shortLabel(day.date)}
          </span>
        </div>
      ))}
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

export function PerformancePage() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { windowDays, days, summary, loading, error } = usePerformance(
    isMobile ? 7 : 14,
  );
  const hasData = summary.sessions > 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 mb-1 text-2xl font-bold">Performance</h1>
        <p className="text-muted">Últimos {windowDays} dias</p>
      </div>

      {error ? (
        <div className="mt-4 text-center text-danger">{error}</div>
      ) : loading ? (
        <div className="mt-4 text-center text-muted">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className={card}>
              <span className="text-xs uppercase tracking-wide text-muted">
                Foco
              </span>
              <span className="text-xl font-bold text-primary">
                {formatDuration(summary.focusSeconds)}
              </span>
            </div>
            <div className={card}>
              <span className="text-xs uppercase tracking-wide text-muted">
                Pausa
              </span>
              <span className="text-xl font-bold text-sandy-brown-500">
                {formatDuration(summary.breakSeconds)}
              </span>
            </div>
          </div>

          {hasData ? (
            <div className={card}>
              <div className="mb-3 flex items-center gap-4">
                <LegendDot className="bg-primary" label="Foco" />
                <LegendDot className="bg-sandy-brown-400" label="Pausa" />
              </div>
              <Chart days={days} />
            </div>
          ) : (
            <div className="mt-4 text-center text-muted">
              Sem sessões nos últimos {windowDays} dias. Rode um timer para
              começar a ver sua performance.
            </div>
          )}
        </>
      )}
    </div>
  );
}
