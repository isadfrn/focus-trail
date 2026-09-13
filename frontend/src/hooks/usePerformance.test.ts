import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/session.api", () => ({
  sessionApi: { list: vi.fn() },
}));

import { sessionApi } from "../api/session.api";
import type { PomodoroSession, SessionsPage } from "../types/session";
import { usePerformance } from "./usePerformance";

function makeSession(type: "focus" | "break", durationSeconds: number): PomodoroSession {
  return {
    id: Math.random().toString(36),
    userId: "u",
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    durationSeconds,
    type,
    completed: true,
    character: "mario-world",
    createdAt: new Date().toISOString(),
  };
}

function page(sessions: PomodoroSession[], nextCursor: string | null = null): SessionsPage {
  return { sessions, nextCursor };
}

afterEach(() => vi.clearAllMocks());

describe("usePerformance", () => {
  it("loads sessions and aggregates the window", async () => {
    vi.mocked(sessionApi.list).mockResolvedValue(
      page([makeSession("focus", 1500), makeSession("break", 300)]),
    );
    const { result } = renderHook(() => usePerformance(14));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.summary).toEqual({
      focusSeconds: 1500,
      breakSeconds: 300,
      sessions: 2,
    });
    expect(result.current.days).toHaveLength(14);
  });

  it("paginates through all pages within the window", async () => {
    vi.mocked(sessionApi.list)
      .mockResolvedValueOnce(page([makeSession("focus", 600)], "cursor"))
      .mockResolvedValueOnce(page([makeSession("focus", 400)], null));
    const { result } = renderHook(() => usePerformance(7));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.summary.focusSeconds).toBe(1000);
    expect(result.current.summary.sessions).toBe(2);
    expect(sessionApi.list).toHaveBeenCalledTimes(2);
  });

  it("reports an error when loading fails", async () => {
    vi.mocked(sessionApi.list).mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => usePerformance());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });
});
