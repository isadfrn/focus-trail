import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/session.api", () => ({
  sessionApi: { stats: vi.fn(), tasks: vi.fn() },
}));

import { sessionApi } from "../api/session.api";
import { utcDayKey } from "../lib/performance";
import type { SessionStats, TaskSummary } from "../types/session";
import { useShareData } from "./useShareData";

const totals = {
  focusSeconds: 9300,
  breakSeconds: 600,
  completedFocus: 6,
  interruptedFocus: 1,
  sessions: 8,
};

function statsWith(days: SessionStats["days"] = []): SessionStats {
  return { days, totals };
}

const task: TaskSummary = {
  label: "Estudar inglês",
  focusSeconds: 4500,
  completedFocus: 3,
  sessions: 3,
  activeDays: 2,
  firstAt: "2026-09-01T10:00:00.000Z",
  lastAt: "2026-09-02T10:00:00.000Z",
};

afterEach(() => vi.clearAllMocks());

describe("useShareData", () => {
  it("does nothing while disabled", () => {
    const { result } = renderHook(() =>
      useShareData({ enabled: false, date: new Date(), goalMinutes: 0 }),
    );
    expect(result.current.day).toBeNull();
    expect(sessionApi.stats).not.toHaveBeenCalled();
    expect(sessionApi.tasks).not.toHaveBeenCalled();
  });

  it("loads the local-day totals and the task list", async () => {
    vi.mocked(sessionApi.stats).mockResolvedValue(statsWith());
    vi.mocked(sessionApi.tasks).mockResolvedValue({ tasks: [task] });
    const date = new Date(2026, 8, 25, 21, 0, 0);

    const { result } = renderHook(() =>
      useShareData({ enabled: true, date, goalMinutes: 0 }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.day).toEqual({
      focusSeconds: 9300,
      completedFocus: 6,
      interruptedFocus: 1,
      streak: 0,
    });
    expect(result.current.tasks).toEqual([task]);
    expect(sessionApi.stats).toHaveBeenCalledTimes(1);
    expect(sessionApi.stats).toHaveBeenCalledWith({
      from: new Date(2026, 8, 25).toISOString(),
      to: new Date(2026, 8, 26).toISOString(),
    });
  });

  it("computes the streak only for today with a goal", async () => {
    const todayKey = utcDayKey(new Date());
    vi.mocked(sessionApi.stats)
      .mockResolvedValueOnce(statsWith())
      .mockResolvedValueOnce(
        statsWith([
          {
            date: todayKey,
            focusSeconds: 7200,
            breakSeconds: 0,
            completedFocus: 4,
            interruptedFocus: 0,
            sessions: 4,
          },
        ]),
      );
    vi.mocked(sessionApi.tasks).mockResolvedValue({ tasks: [] });

    const { result } = renderHook(() =>
      useShareData({ enabled: true, date: new Date(), goalMinutes: 60 }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(sessionApi.stats).toHaveBeenCalledTimes(2);
    expect(result.current.day?.streak).toBe(1);
  });

  it("skips the streak request for past days", async () => {
    vi.mocked(sessionApi.stats).mockResolvedValue(statsWith());
    vi.mocked(sessionApi.tasks).mockResolvedValue({ tasks: [] });

    const { result } = renderHook(() =>
      useShareData({
        enabled: true,
        date: new Date(2020, 0, 10),
        goalMinutes: 60,
      }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(sessionApi.stats).toHaveBeenCalledTimes(1);
    expect(result.current.day?.streak).toBe(0);
  });

  it("reports a friendly error when loading fails", async () => {
    vi.mocked(sessionApi.stats).mockRejectedValue(new Error("boom"));
    vi.mocked(sessionApi.tasks).mockResolvedValue({ tasks: [] });

    const { result } = renderHook(() =>
      useShareData({ enabled: true, date: new Date(), goalMinutes: 0 }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Não consegui carregar seus dados de foco.");
    expect(result.current.day).toBeNull();
  });
});
