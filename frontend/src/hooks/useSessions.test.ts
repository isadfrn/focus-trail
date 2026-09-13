import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/session.api", () => ({
  sessionApi: {
    list: vi.fn(),
    remove: vi.fn(),
    removeMany: vi.fn(),
    removeAll: vi.fn(),
  },
}));

import { sessionApi } from "../api/session.api";
import type { PomodoroSession, SessionsPage } from "../types/session";
import { useSessions } from "./useSessions";

function makeSession(id: string): PomodoroSession {
  return { id } as unknown as PomodoroSession;
}

function makePage(ids: string[], nextCursor: string | null = null): SessionsPage {
  return { sessions: ids.map(makeSession), nextCursor };
}

afterEach(() => vi.clearAllMocks());

describe("useSessions", () => {
  it("loads the first page", async () => {
    vi.mocked(sessionApi.list).mockResolvedValue(makePage(["1", "2"], "cursor"));
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sessions).toHaveLength(2);
    expect(result.current.hasMore).toBe(true);
  });

  it("reports an error when the first load fails", async () => {
    vi.mocked(sessionApi.list).mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });

  it("appends the next page on loadMore", async () => {
    vi.mocked(sessionApi.list)
      .mockResolvedValueOnce(makePage(["1"], "cursor"))
      .mockResolvedValueOnce(makePage(["2"], null));
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.sessions).toHaveLength(2));
    expect(result.current.hasMore).toBe(false);
  });

  it("removes one, many and all sessions", async () => {
    vi.mocked(sessionApi.list).mockResolvedValue(makePage(["1", "2", "3"], null));
    vi.mocked(sessionApi.remove).mockResolvedValue({ deleted: 1 });
    vi.mocked(sessionApi.removeMany).mockResolvedValue({ deleted: 1 });
    vi.mocked(sessionApi.removeAll).mockResolvedValue({ deleted: 3 });
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeOne("1");
    });
    expect(result.current.sessions.map((s) => s.id)).toEqual(["2", "3"]);

    await act(async () => {
      await result.current.removeMany(["2"]);
    });
    expect(result.current.sessions.map((s) => s.id)).toEqual(["3"]);

    await act(async () => {
      await result.current.removeAll();
    });
    expect(result.current.sessions).toHaveLength(0);
  });

  it("does not load more without a next cursor", async () => {
    vi.mocked(sessionApi.list).mockResolvedValue(makePage(["1"], null));
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(sessionApi.list).mockClear();
    act(() => {
      result.current.loadMore();
    });
    expect(sessionApi.list).not.toHaveBeenCalled();
  });

  it("reloads when the filters change", async () => {
    vi.mocked(sessionApi.list).mockResolvedValue(makePage(["1"], null));
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(sessionApi.list).mockResolvedValue(makePage(["9"], null));
    await act(async () => {
      result.current.setFilters({ type: "focus" });
    });
    await waitFor(() =>
      expect(result.current.sessions.map((s) => s.id)).toEqual(["9"]),
    );
  });
});
