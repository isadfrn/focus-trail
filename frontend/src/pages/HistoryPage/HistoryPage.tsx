import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { ShareDialog, type ShareScope } from "../../components/ShareDialog/ShareDialog";
import { useSessions } from "../../hooks/useSessions";
import { formatDateTime, formatDuration } from "../../lib/format";
import {
  buildSessionFilters,
  emptyFilterForm,
  type FilterForm,
} from "../../lib/history-filters";
import { useToast } from "../../providers/ToastProvider";
import type { PomodoroSession } from "../../types/session";

type Pending =
  | { kind: "one"; id: string }
  | { kind: "selected"; ids: string[] }
  | { kind: "all" };

const fieldClass =
  "rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

const table =
  "w-full border-collapse overflow-hidden rounded-xl border border-border bg-surface text-sm " +
  "[&_th]:border-b [&_th]:border-border [&_th]:bg-background [&_th]:px-3.5 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold " +
  "[&_td]:border-b [&_td]:border-border [&_td]:px-3.5 [&_td]:py-2.5 [&_td]:text-left " +
  "[&_tr:last-child_td]:border-b-0";

const checkbox = "size-4 cursor-pointer align-middle accent-primary";

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path
        d="M2.5 4h11 M6 4V2.8c0-.4.3-.8.8-.8h2.4c.5 0 .8.4.8.8V4 M4.8 4l.5 9c0 .5.4.9.9.9h3.6c.5 0 .9-.4.9-.9L11.2 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ShareTarget {
  scope: ShareScope;
  date: Date;
  taskLabel?: string;
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path
        d="M8 10.5V2.5 M5 5.2 8 2.3l3 2.9 M3 8.5v4c0 .6.4 1 1 1h8c.6 0 1-.4 1-1v-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusLabel({ session }: { session: PomodoroSession }) {
  const { t } = useTranslation();

  return session.completed ? (
    <span className="text-xs text-ok">{t("history.statusRow.completed")}</span>
  ) : (
    <span className="text-xs text-muted">
      {t("history.statusRow.interrupted")}
    </span>
  );
}

export function HistoryPage() {
  const { t } = useTranslation();
  const {
    sessions,
    loading,
    loadingMore,
    error,
    hasMore,
    setFilters,
    loadMore,
    removeOne,
    removeMany,
    removeAll,
  } = useSessions();
  const toast = useToast();

  const [form, setForm] = useState<FilterForm>(emptyFilterForm);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const shareSession = (session: PomodoroSession) => {
    setShareTarget({
      scope: session.taskLabel ? "task" : "day",
      date: new Date(session.startedAt),
      taskLabel: session.taskLabel ?? undefined,
    });
    setShareOpen(true);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(buildSessionFilters(form));
      setSelected(new Set());
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [form, setFilters]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const update = (patch: Partial<FilterForm>) =>
    setForm((cur) => ({ ...cur, ...patch }));

  const filtersActive =
    form.date !== "" ||
    form.type !== "" ||
    form.task !== "" ||
    form.status !== "" ||
    (form.durationOp !== "" && form.durationMinutes !== "");

  const allSelected = sessions.length > 0 && selected.size === sessions.length;

  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(sessions.map((s) => s.id)));

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      let count = 0;
      if (pending.kind === "one") {
        await removeOne(pending.id);
        count = 1;
      } else if (pending.kind === "selected") {
        await removeMany(pending.ids);
        count = pending.ids.length;
      } else {
        await removeAll();
        count = sessions.length;
      }
      setSelected(new Set());
      setPending(null);
      toast(t("history.deleted", { count }));
    } catch {
      toast(t("history.deleteFailed"));
    } finally {
      setBusy(false);
    }
  };

  const pendingText =
    pending?.kind === "all"
      ? t("history.confirm.all")
      : pending?.kind === "selected"
        ? t("history.confirm.selected", { count: pending.ids.length })
        : pending?.kind === "one"
          ? t("history.confirm.one")
          : "";

  return (
    <div>
      <h1 className="m-0 mb-4 text-2xl font-bold">{t("history.title")}</h1>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t("history.filters.date")}
          <input
            type="date"
            value={form.date}
            onChange={(e) => update({ date: e.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t("history.filters.type")}
          <select
            value={form.type}
            onChange={(e) =>
              update({ type: e.target.value as FilterForm["type"] })
            }
            className={fieldClass}
          >
            <option value="">{t("history.filters.all")}</option>
            <option value="focus">{t("history.types.focus")}</option>
            <option value="break">{t("history.types.break")}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t("history.filters.status")}
          <select
            value={form.status}
            onChange={(e) =>
              update({ status: e.target.value as FilterForm["status"] })
            }
            className={fieldClass}
          >
            <option value="">{t("history.filters.all")}</option>
            <option value="completed">{t("history.statusOptions.completed")}</option>
            <option value="interrupted">
              {t("history.statusOptions.interrupted")}
            </option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t("history.filters.duration")}
          <div className="flex gap-1">
            <select
              value={form.durationOp}
              onChange={(e) =>
                update({ durationOp: e.target.value as FilterForm["durationOp"] })
              }
              aria-label={t("history.filters.durationOperator")}
              className={`${fieldClass} w-14`}
            >
              <option value="">—</option>
              <option value="eq">=</option>
              <option value="gt">&gt;</option>
              <option value="lt">&lt;</option>
            </select>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={t("history.filters.minutesPlaceholder")}
              value={form.durationMinutes}
              onChange={(e) => update({ durationMinutes: e.target.value })}
              className={`${fieldClass} w-full`}
            />
          </div>
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-xs text-muted sm:col-span-4">
          {t("history.filters.task")}
          <input
            type="text"
            value={form.task}
            onChange={(e) => update({ task: e.target.value })}
            placeholder={t("history.filters.taskPlaceholder")}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {filtersActive && (
          <Button variant="ghost" onClick={() => setForm(emptyFilterForm)}>
            {t("history.filters.clear")}
          </Button>
        )}
        <Button
          variant="danger"
          className="max-sm:hidden"
          disabled={selected.size === 0}
          onClick={() => setPending({ kind: "selected", ids: [...selected] })}
        >
          {selected.size > 0
            ? t("history.filters.deleteSelectedCount", { count: selected.size })
            : t("history.filters.deleteSelected")}
        </Button>
        <Button
          variant="ghost"
          className="text-danger hover:bg-danger/10"
          disabled={sessions.length === 0}
          onClick={() => setPending({ kind: "all" })}
        >
          {t("history.filters.deleteAll")}
        </Button>
      </div>

      {error ? (
        <div className="mt-8 text-center text-danger">{error}</div>
      ) : loading ? (
        <div className="mt-8 text-center text-muted">
          {t("common.loading")}
        </div>
      ) : sessions.length === 0 ? (
        <div className="mt-8 text-center text-muted">
          {filtersActive
            ? t("history.emptyFiltered")
            : t("history.empty")}
        </div>
      ) : (
        <>
          <div className="mt-4 hidden sm:block">
            <table className={table}>
              <thead>
                <tr>
                  <th className="w-9">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label={t("history.selectAll")}
                      className={checkbox}
                    />
                  </th>
                  <th>{t("history.columns.when")}</th>
                  <th>{t("history.columns.type")}</th>
                  <th>{t("history.columns.task")}</th>
                  <th>{t("history.columns.duration")}</th>
                  <th>{t("history.columns.status")}</th>
                  <th className="w-10">
                    <span className="sr-only">{t("history.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    className={selected.has(s.id) ? "bg-background/60" : undefined}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggle(s.id)}
                        aria-label={t("history.selectSession", {
                          date: formatDateTime(s.startedAt),
                        })}
                        className={checkbox}
                      />
                    </td>
                    <td>{formatDateTime(s.startedAt)}</td>
                    <td>{t(s.type === "focus" ? "history.types.focus" : "history.types.break")}</td>
                    <td className="max-w-[220px] truncate text-muted">
                      {s.taskLabel ?? "—"}
                    </td>
                    <td>{formatDuration(s.durationSeconds)}</td>
                    <td>
                      <StatusLabel session={s} />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {s.type === "focus" && (
                          <button
                            type="button"
                            onClick={() => shareSession(s)}
                            aria-label={t("history.shareSession")}
                            className="flex size-8 items-center justify-center rounded-lg text-muted cursor-pointer outline-none hover:bg-background hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <ShareIcon />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPending({ kind: "one", id: s.id })}
                          aria-label={t("history.deleteSession")}
                          className="flex size-8 items-center justify-center rounded-lg text-muted cursor-pointer outline-none hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-danger"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 flex flex-col gap-2 sm:hidden">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-3.5"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">
                    {t(s.type === "focus" ? "history.types.focus" : "history.types.break")} -{" "}
                    {formatDuration(s.durationSeconds)}
                  </span>
                  {s.taskLabel && (
                    <span className="truncate text-xs text-foreground">
                      {s.taskLabel}
                    </span>
                  )}
                  <span className="text-xs text-muted">
                    {formatDateTime(s.startedAt)}
                  </span>
                  <StatusLabel session={s} />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {s.type === "focus" && (
                    <button
                      type="button"
                      onClick={() => shareSession(s)}
                      aria-label={t("history.shareSession")}
                      className="flex size-8 items-center justify-center rounded-lg text-muted cursor-pointer outline-none hover:bg-background hover:text-primary"
                    >
                      <ShareIcon />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPending({ kind: "one", id: s.id })}
                    aria-label={t("history.deleteSession")}
                    className="flex size-8 items-center justify-center rounded-lg text-muted cursor-pointer outline-none hover:bg-danger/10 hover:text-danger"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div ref={sentinelRef} className="h-8" aria-hidden="true" />
          {loadingMore && (
            <div className="py-2 text-center text-sm text-muted">
              {t("history.loadingMore")}
            </div>
          )}
          {!hasMore && (
            <div className="py-2 text-center text-xs text-muted">
              {t("history.endOfList")}
            </div>
          )}
        </>
      )}

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        initialScope={shareTarget?.scope}
        date={shareTarget?.date}
        initialTaskLabel={shareTarget?.taskLabel}
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setPending(null);
        }}
        title={t("history.confirm.title")}
        description={pendingText}
        busy={busy}
        onConfirm={confirm}
      />
    </div>
  );
}
