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
};
