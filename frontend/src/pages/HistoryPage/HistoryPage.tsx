import { useSessions } from "../../hooks/useSessions";
import { formatDateTime, formatDuration } from "../../lib/format";

const table =
  "mt-4 w-full min-w-[360px] border-collapse overflow-hidden rounded-xl border border-border bg-surface text-sm " +
  "[&_th]:border-b [&_th]:border-border [&_th]:bg-background [&_th]:px-3.5 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold " +
  "[&_td]:border-b [&_td]:border-border [&_td]:px-3.5 [&_td]:py-2.5 [&_td]:text-left " +
  "[&_tr:last-child_td]:border-b-0 " +
  "max-sm:text-[13px] max-sm:[&_th]:px-2.5 max-sm:[&_td]:px-2.5";

export function HistoryPage() {
  const { sessions, error } = useSessions();

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
        <div className="w-full overflow-x-auto">
          <table className={table}>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tipo</th>
                <th>Duracao</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
