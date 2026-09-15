import { useState } from "react";

import { usePerformance } from "../../hooks/usePerformance";
import { formatDuration } from "../../lib/format";
import type { DayTotals, TodayProgress } from "../../lib/performance";
import { useAuth } from "../../providers/AuthProvider";

const card =
  "flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 shadow-app";

const field =
  "rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

const WINDOW_OPTIONS = [7, 14, 30];

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={card}>
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="text-xl font-bold text-foreground">{value}</span>
    </div>
  );
}

function GoalCard({
  goalMinutes,
  today,
  streak,
}: {
  goalMinutes: number;
  today: TodayProgress;
  streak: number;
}) {
  const percent = Math.round(today.ratio * 100);
  const streakLabel = `${streak} ${streak === 1 ? "dia" : "dias"}`;

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted">
          Meta de hoje
        </span>
        {goalMinutes > 0 && (
          <span className="text-xs font-semibold text-sandy-brown-500">
            🔥 {streakLabel}
          </span>
        )}
      </div>

      {goalMinutes > 0 ? (
        <>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-primary">
              {formatDuration(today.focusSeconds)}
            </span>
            <span className="text-sm text-muted">
              / {formatDuration(today.goalSeconds)}
            </span>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Progresso da meta diária de foco"
          >
            <div
              className={`h-full rounded-full ${today.reached ? "bg-ok" : "bg-primary"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          {today.reached && (
            <span className="mt-1 text-xs text-ok">Meta concluída hoje! 🎉</span>
          )}
        </>
      ) : (
        <span className="mt-1 text-sm text-muted">
          Defina uma meta diária de foco no seu perfil para acompanhar seu
          progresso e sua sequência.
        </span>
      )}
    </div>
  );
}

export function PerformancePage() {
  const { user } = useAuth();
  const goalMinutes = user?.dailyFocusGoalMinutes ?? 0;

  const [windowDays, setWindowDays] = useState(14);
  const {
    days,
    totals,
    completionRate,
    focusBreakRatio,
    bestDay,
    streak,
    today,
    loading,
    error,
  } = usePerformance(windowDays, goalMinutes);
  const hasData = totals.sessions > 0;

  const ratioLabel =
    focusBreakRatio === null ? "—" : `${focusBreakRatio.toFixed(1)}:1`;
  const bestDayLabel = bestDay
    ? `${shortLabel(bestDay.date)} · ${formatDuration(bestDay.focusSeconds)}`
    : "—";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-3">
        <h1 className="m-0 text-2xl font-bold">Performance</h1>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Período
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            aria-label="Período"
            className={field}
          >
            {WINDOW_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} dias
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="mt-4 text-center text-danger">{error}</div>
      ) : loading ? (
        <div className="mt-4 text-center text-muted">Carregando...</div>
      ) : (
        <>
          <GoalCard goalMinutes={goalMinutes} today={today} streak={streak} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Foco" value={formatDuration(totals.focusSeconds)} />
            <Metric label="Pausa" value={formatDuration(totals.breakSeconds)} />
            <Metric
              label="Conclusão"
              value={`${Math.round(completionRate * 100)}%`}
            />
            <Metric label="Foco:Pausa" value={ratioLabel} />
          </div>

          {hasData ? (
            <div className={card}>
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <LegendDot className="bg-primary" label="Foco" />
                  <LegendDot className="bg-sandy-brown-400" label="Pausa" />
                </div>
                <span className="text-xs text-muted">
                  Melhor dia: {bestDayLabel}
                </span>
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
