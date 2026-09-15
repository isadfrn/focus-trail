import { useEffect, useRef, useState } from "react";

import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
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

function statusLabel(s: PomodoroSession) {
  return s.completed ? (
    <span className="text-xs text-ok">concluida</span>
  ) : (
    <span className="text-xs text-muted">interrompida</span>
  );
}

export function HistoryPage() {
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

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(buildSessionFilters(form));
      setSelected(new Set());
    }, 250);
    return () => clearTimeout(t);
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
      toast(count === 1 ? "Sessao apagada." : `${count} sessoes apagadas.`);
    } catch {
      toast("Nao consegui apagar. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const pendingText =
    pending?.kind === "all"
      ? "Apagar TODAS as suas sessoes? Essa acao nao pode ser desfeita."
      : pending?.kind === "selected"
        ? `Apagar ${pending.ids.length} sessao(oes) selecionada(s)? Essa acao nao pode ser desfeita.`
        : pending?.kind === "one"
          ? "Apagar esta sessao? Essa acao nao pode ser desfeita."
          : "";

  return (
    <div>
      <h1 className="m-0 mb-4 text-2xl font-bold">Historico</h1>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Data
          <input
            type="date"
            value={form.date}
            onChange={(e) => update({ date: e.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Tipo
          <select
            value={form.type}
            onChange={(e) =>
              update({ type: e.target.value as FilterForm["type"] })
            }
            className={fieldClass}
          >
            <option value="">Todos</option>
            <option value="focus">Foco</option>
            <option value="break">Pausa</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Status
          <select
            value={form.status}
            onChange={(e) =>
              update({ status: e.target.value as FilterForm["status"] })
            }
            className={fieldClass}
          >
            <option value="">Todos</option>
            <option value="completed">Concluida</option>
            <option value="interrupted">Interrompida</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Duracao (min)
          <div className="flex gap-1">
            <select
              value={form.durationOp}
              onChange={(e) =>
                update({ durationOp: e.target.value as FilterForm["durationOp"] })
              }
              aria-label="Operador de duracao"
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
              placeholder="min"
              value={form.durationMinutes}
              onChange={(e) => update({ durationMinutes: e.target.value })}
              className={`${fieldClass} w-full`}
            />
          </div>
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-xs text-muted sm:col-span-4">
          Tarefa
          <input
            type="text"
            value={form.task}
            onChange={(e) => update({ task: e.target.value })}
            placeholder="Buscar por tarefa"
            className={fieldClass}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {filtersActive && (
          <Button variant="ghost" onClick={() => setForm(emptyFilterForm)}>
            Limpar filtros
          </Button>
        )}
        <Button
          variant="danger"
          className="max-sm:hidden"
          disabled={selected.size === 0}
          onClick={() => setPending({ kind: "selected", ids: [...selected] })}
        >
          Apagar selecionados{selected.size > 0 ? ` (${selected.size})` : ""}
        </Button>
        <Button
          variant="ghost"
          className="text-danger hover:bg-danger/10"
          disabled={sessions.length === 0}
          onClick={() => setPending({ kind: "all" })}
        >
          Apagar tudo
        </Button>
      </div>

      {error ? (
        <div className="mt-8 text-center text-danger">{error}</div>
      ) : loading ? (
        <div className="mt-8 text-center text-muted">Carregando...</div>
      ) : sessions.length === 0 ? (
        <div className="mt-8 text-center text-muted">
          {filtersActive
            ? "Nenhuma sessao para esses filtros."
            : "Nenhuma sessao ainda."}
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
                      aria-label="Selecionar todas as carregadas"
                      className={checkbox}
                    />
                  </th>
                  <th>Quando</th>
                  <th>Tipo</th>
                  <th>Tarefa</th>
                  <th>Duracao</th>
                  <th>Status</th>
                  <th className="w-10">
                    <span className="sr-only">Acoes</span>
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
                        aria-label={`Selecionar sessao de ${formatDateTime(s.startedAt)}`}
                        className={checkbox}
                      />
                    </td>
                    <td>{formatDateTime(s.startedAt)}</td>
                    <td>{s.type === "focus" ? "Foco" : "Pausa"}</td>
                    <td className="max-w-[220px] truncate text-muted">
                      {s.taskLabel ?? "—"}
                    </td>
                    <td>{formatDuration(s.durationSeconds)}</td>
                    <td>{statusLabel(s)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setPending({ kind: "one", id: s.id })}
                        aria-label="Apagar sessao"
                        className="flex size-8 items-center justify-center rounded-lg text-muted cursor-pointer outline-none hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-danger"
                      >
                        <TrashIcon />
                      </button>
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
                    {s.type === "focus" ? "Foco" : "Pausa"} -{" "}
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
                  {statusLabel(s)}
                </div>
                <button
                  type="button"
                  onClick={() => setPending({ kind: "one", id: s.id })}
                  aria-label="Apagar sessao"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted cursor-pointer outline-none hover:bg-danger/10 hover:text-danger"
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>

          <div ref={sentinelRef} className="h-8" aria-hidden="true" />
          {loadingMore && (
            <div className="py-2 text-center text-sm text-muted">
              Carregando mais...
            </div>
          )}
          {!hasMore && (
            <div className="py-2 text-center text-xs text-muted">
              Fim do historico.
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setPending(null);
        }}
        title="Apagar sessoes"
        description={pendingText}
        busy={busy}
        onConfirm={confirm}
      />
    </div>
  );
}
