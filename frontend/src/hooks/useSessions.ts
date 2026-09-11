import { useEffect, useState } from "react";

import { sessionApi } from "../api/session.api";
import type { PomodoroSession } from "../types/session";

interface UseSessions {
  sessions: PomodoroSession[] | null;
  error: string | null;
  removeOne: (id: string) => Promise<void>;
  removeMany: (ids: string[]) => Promise<void>;
  removeAll: () => Promise<void>;
}

/**
 * Loads and mutates the current user's pomodoro sessions. `sessions === null`
 * means still loading. Data fetching lives here so the History page stays
 * presentational; delete actions update local state after the API confirms.
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

  const removeOne = async (id: string) => {
    await sessionApi.remove(id);
    setSessions((cur) => cur && cur.filter((s) => s.id !== id));
  };

  const removeMany = async (ids: string[]) => {
    await sessionApi.removeMany(ids);
    const set = new Set(ids);
    setSessions((cur) => cur && cur.filter((s) => !set.has(s.id)));
  };

  const removeAll = async () => {
    await sessionApi.removeAll();
    setSessions([]);
  };

  return { sessions, error, removeOne, removeMany, removeAll };
}
