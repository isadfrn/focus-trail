import { useEffect, useState } from "react";

import { sessionApi } from "../api/session.api";
import type { PomodoroSession } from "../types/session";

interface UseSessions {
  sessions: PomodoroSession[] | null;
  error: string | null;
}

/**
 * Loads the current user's pomodoro sessions. `sessions === null` means still
 * loading. Data fetching lives here so the History page stays presentational.
 */
export function useSessions(): UseSessions {
  const [sessions, setSessions] = useState<PomodoroSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sessionApi
      .list()
      .then((r) => setSessions(r.sessions))
      .catch(() => setError("Nao consegui carregar o historico."));
  }, []);

  return { sessions, error };
}
