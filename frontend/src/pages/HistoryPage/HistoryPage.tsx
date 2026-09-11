import { useEffect, useRef, useState } from "react";

import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { useSessions } from "../../hooks/useSessions";
import { formatDateTime, formatDuration } from "../../lib/format";
import { useToast } from "../../providers/ToastProvider";

type Pending =
  | { kind: "one"; id: string }
  | { kind: "selected"; ids: string[] }
  | { kind: "all" };

const table =
  "mt-4 w-full min-w-[420px] border-collapse overflow-hidden rounded-xl border border-border bg-surface text-sm " +
  "[&_th]:border-b [&_th]:border-border [&_th]:bg-background [&_th]:px-3.5 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold " +
  "[&_td]:border-b [&_td]:border-border [&_td]:px-3.5 [&_td]:py-2.5 [&_td]:text-left " +
  "[&_tr:last-child_td]:border-b-0 " +
  "max-sm:text-[13px] max-sm:[&_th]:px-2.5 max-sm:[&_td]:px-2.5";

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

export function HistoryPage() {
  const { sessions, error, removeOne, removeMany, removeAll } = useSessions();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const headerCbRef = useRef<HTMLInputElement>(null);

  const total = sessions?.length ?? 0;
  const allSelected = total > 0 && selected.size === total;

  useEffect(() => {
    const el = headerCbRef.current;
    if (el) el.indeterminate = selected.size > 0 && selected.size < total;
  }, [selected, total]);

  if (error)
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-danger">
        {error}
      </div>
    );
  if (!sessions)
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        Carregando...
      </div>
    );

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
        count = total;
        await removeAll();
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
      ? `Apagar todas as ${total} sessoes? Essa acao nao pode ser desfeita.`
      : pending?.kind === "selected"
        ? `Apagar ${pending.ids.length} sessao(oes) selecionada(s)? Essa acao nao pode ser desfeita.`
        : pending?.kind === "one"
          ? "Apagar esta sessao? Essa acao nao pode ser desfeita."
          : "";

  const focusCount = sessions.filter(
    (s) => s.type === "focus" && s.completed,
  ).length;

  return (
    <div>
      <h1 className="m-0 mb-1 text-2xl font-bold">Historico</h1>
      <p className="text-muted">
        {sessions.length} sessao(oes) - {focusCount} foco(s) concluido(s)
      </p>

      {sessions.length === 0 ? (
        <div className="mt-8 text-center text-muted">Nenhuma sessao ainda.</div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant="danger"
              disabled={selected.size === 0}
              onClick={() => setPending({ kind: "selected", ids: [...selected] })}
            >
              Apagar selecionados{selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
            <Button
              variant="ghost"
              className="text-danger hover:bg-danger/10"
              onClick={() => setPending({ kind: "all" })}
            >
              Apagar tudo
            </Button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className={table}>
              <thead>
                <tr>
                  <th className="w-9">
                    <input
                      ref={headerCbRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Selecionar todas"
                      className={checkbox}
                    />
                  </th>
                  <th>Quando</th>
                  <th>Tipo</th>
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
                    <td>{formatDuration(s.durationSeconds)}</td>
                    <td>
                      {s.completed ? (
                        <span className="text-xs text-ok">concluida</span>
                      ) : (
                        <span className="text-xs text-muted">interrompida</span>
                      )}
                    </td>
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
