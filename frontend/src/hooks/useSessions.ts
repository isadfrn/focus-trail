import { useCallback, useEffect, useRef, useState } from "react";

import { sessionApi } from "../api/session.api";
import type { PomodoroSession, SessionFilters } from "../types/session";

const PAGE_SIZE = 20;

interface UseSessions {
  sessions: PomodoroSession[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  setFilters: (filters: SessionFilters) => void;
  loadMore: () => void;
  removeOne: (id: string) => Promise<void>;
  removeMany: (ids: string[]) => Promise<void>;
  removeAll: () => Promise<void>;
}

export function useSessions(): UseSessions {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<SessionFilters>({});

  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    sessionApi
      .list({ limit: PAGE_SIZE, filters })
      .then((page) => {
        if (id !== reqId.current) return;
        setSessions(page.sessions);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        if (id !== reqId.current) return;
        setError("Nao consegui carregar o historico.");
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [filters]);

  const setFilters = useCallback((next: SessionFilters) => {
    setFiltersState(next);
  }, []);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !nextCursor) return;
    const id = reqId.current;
    setLoadingMore(true);
    sessionApi
      .list({ limit: PAGE_SIZE, cursor: nextCursor, filters })
      .then((page) => {
        if (id !== reqId.current) return;
        setSessions((cur) => [...cur, ...page.sessions]);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
      })
      .finally(() => {
        if (id === reqId.current) setLoadingMore(false);
      });
  }, [loading, loadingMore, nextCursor, filters]);

  const removeOne = async (id: string) => {
    await sessionApi.remove(id);
    setSessions((cur) => cur.filter((s) => s.id !== id));
  };

  const removeMany = async (ids: string[]) => {
    await sessionApi.removeMany(ids);
    const set = new Set(ids);
    setSessions((cur) => cur.filter((s) => !set.has(s.id)));
  };

  const removeAll = async () => {
    await sessionApi.removeAll();
    setSessions([]);
    setNextCursor(null);
  };

  return {
    sessions,
    loading,
    loadingMore,
    error,
    hasMore: nextCursor !== null,
    setFilters,
    loadMore,
    removeOne,
    removeMany,
    removeAll,
  };
}
