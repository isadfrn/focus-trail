import { request } from "../lib/http";
import type { NewSession, PomodoroSession } from "../types/session";

/** Pomodoro-session data access (the "repository" for the sessions resource). */
export const sessionApi = {
  create: (data: NewSession) =>
    request<{ session: PomodoroSession }>("/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: () => request<{ sessions: PomodoroSession[] }>("/sessions"),
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
