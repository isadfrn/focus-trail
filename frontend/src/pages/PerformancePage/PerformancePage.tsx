import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/Button/Button";
import { ShareDialog } from "../../components/ShareDialog/ShareDialog";
import { usePerformance } from "../../hooks/usePerformance";
import { formatDuration, formatRatio, formatShortDay } from "../../lib/format";
import type { DayTotals, TodayProgress } from "../../lib/performance";
import { useAuth } from "../../providers/AuthProvider";

const card =
  "flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 shadow-app";

const field =
  "rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

const WINDOW_OPTIONS = [7, 14, 30];

function barHeight(value: number, max: number): string {
  if (value <= 0) return "0%";
  return `${Math.max(4, Math.round((value / max) * 100))}%`;
}

function Chart({ days }: { days: DayTotals[] }) {
  const { t } = useTranslation();
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
          title={t("performance.chartTooltip", {
            date: formatShortDay(day.date),
            focus: formatDuration(day.focusSeconds),
            breakTime: formatDuration(day.breakSeconds),
          })}
        >
          <div className="flex h-full w-full items-end justify-center gap-1">
            <div
              className="w-2 rounded-t bg-primary"
              style={{ height: barHeight(day.focusSeconds, max) }}
            />
            <div
              className="w-2 rounded-t bg-accent-400"
              style={{ height: barHeight(day.breakSeconds, max) }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted">
            {formatShortDay(day.date)}
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
  const { t } = useTranslation();
  const percent = Math.round(today.ratio * 100);
  const streakLabel = t("performance.streak", { count: streak });

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted">
          {t("performance.goalToday")}
        </span>
        {goalMinutes > 0 && (
          <span className="text-xs font-semibold text-accent-500">
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
            aria-label={t("performance.goalProgress")}
          >
            <div
              className={`h-full rounded-full ${today.reached ? "bg-ok" : "bg-primary"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          {today.reached && (
            <span className="mt-1 text-xs text-ok">
              {t("performance.goalReached")}
            </span>
          )}
        </>
      ) : (
        <span className="mt-1 text-sm text-muted">
          {t("performance.goalEmpty")}
        </span>
      )}
    </div>
  );
}

export function PerformancePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const goalMinutes = user?.dailyFocusGoalMinutes ?? 0;

  const [windowDays, setWindowDays] = useState(14);
  const [shareOpen, setShareOpen] = useState(false);
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
    focusBreakRatio === null ? "—" : formatRatio(focusBreakRatio);
  const bestDayLabel = bestDay
    ? `${formatShortDay(bestDay.date)} · ${formatDuration(bestDay.focusSeconds)}`
    : "—";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-3">
        <h1 className="m-0 text-2xl font-bold">{t("performance.title")}</h1>
        <div className="flex items-end gap-3">
          <Button onClick={() => setShareOpen(true)}>
            {t("performance.shareToday")}
          </Button>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t("performance.period")}
            <select
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value))}
              aria-label={t("performance.period")}
              className={field}
            >
              {WINDOW_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t("performance.daysOption", { days: option })}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div className="mt-4 text-center text-danger">{error}</div>
      ) : loading ? (
        <div className="mt-4 text-center text-muted">
          {t("common.loading")}
        </div>
      ) : (
        <>
          <GoalCard goalMinutes={goalMinutes} today={today} streak={streak} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              label={t("performance.metrics.focus")}
              value={formatDuration(totals.focusSeconds)}
            />
            <Metric
              label={t("performance.metrics.break")}
              value={formatDuration(totals.breakSeconds)}
            />
            <Metric
              label={t("performance.metrics.completion")}
              value={`${Math.round(completionRate * 100)}%`}
            />
            <Metric label={t("performance.metrics.ratio")} value={ratioLabel} />
          </div>

          {hasData ? (
            <div className={card}>
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <LegendDot
                    className="bg-primary"
                    label={t("performance.metrics.focus")}
                  />
                  <LegendDot
                    className="bg-accent-400"
                    label={t("performance.metrics.break")}
                  />
                </div>
                <span className="text-xs text-muted">
                  {t("performance.bestDay", { value: bestDayLabel })}
                </span>
              </div>
              <Chart days={days} />
            </div>
          ) : (
            <div className="mt-4 text-center text-muted">
              {t("performance.noData", { days: windowDays })}
            </div>
          )}
        </>
      )}

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
}
