import { request } from "../lib/http";
import type {
  NewSession,
  PomodoroSession,
  SessionFilters,
  SessionsPage,
} from "../types/session";

export function sessionsQuery(params: {
  cursor?: string;
  limit?: number;
  filters?: SessionFilters;
}): string {
  const q = new URLSearchParams();
  if (params.limit) q.set("limit", String(params.limit));
  if (params.cursor) q.set("cursor", params.cursor);
  const f = params.filters ?? {};
  if (f.from) q.set("from", f.from);
  if (f.to) q.set("to", f.to);
  if (f.type) q.set("type", f.type);
  if (f.completed !== undefined) q.set("completed", String(f.completed));
  if (f.durationOp && f.durationSeconds !== undefined) {
    q.set("durationOp", f.durationOp);
    q.set("durationSeconds", String(f.durationSeconds));
  }
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

/** Pomodoro-session data access (the "repository" for the sessions resource). */
export const sessionApi = {
  create: (data: NewSession) =>
    request<{ session: PomodoroSession }>("/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: (params: {
    cursor?: string;
    limit?: number;
    filters?: SessionFilters;
  } = {}) => request<SessionsPage>(`/sessions${sessionsQuery(params)}`),
  remove: (id: string) =>
    request<{ deleted: number }>(`/sessions/${id}`, { method: "DELETE" }),
  removeMany: (ids: string[]) =>
    request<{ deleted: number }>("/sessions", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
  removeAll: () =>
    request<{ deleted: number }>("/sessions", {
      method: "DELETE",
      body: JSON.stringify({ all: true }),
    }),
};
