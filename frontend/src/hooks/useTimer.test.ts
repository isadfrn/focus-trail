import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: null as {
    focusMinutes?: number;
    breakMinutes?: number;
    longBreakMinutes?: number;
    pomodorosUntilLongBreak?: number;
    autoCycle?: boolean;
  } | null,
  setRunning: vi.fn(),
  toast: vi.fn(),
  create: vi.fn(),
  notify: vi.fn(),
  chime: vi.fn(),
}));

vi.mock("../providers/AuthProvider", () => ({
  useAuth: () => ({ user: mocks.user }),
}));
vi.mock("../providers/TimerActivityProvider", () => ({
  useTimerActivity: () => ({ running: false, setRunning: mocks.setRunning }),
}));
vi.mock("../providers/ToastProvider", () => ({
  useToast: () => mocks.toast,
}));
vi.mock("../api/session.api", () => ({
  sessionApi: { create: mocks.create },
}));
vi.mock("../lib/platform", () => ({
  notify: mocks.notify,
}));
vi.mock("../lib/chime", () => ({
  playSessionChime: mocks.chime,
}));

import { useTimer } from "./useTimer";

beforeEach(() => {
  vi.useFakeTimers();
  mocks.user = null;
  mocks.create.mockResolvedValue({});
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  localStorage.clear();
});

describe("useTimer", () => {
  it("defaults to focus with the default presets", () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.type).toBe("focus");
    expect(result.current.presets.map((p) => p.type)).toEqual([
      "focus",
      "break",
    ]);
    expect(result.current.remaining).toBe(25 * 60);
  });

  it("selecting a preset updates the type and duration", () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.selectPreset("break", 5));
    expect(result.current.type).toBe("break");
    expect(result.current.remaining).toBe(5 * 60);
  });

  it("stop records an interrupted session", () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    expect(result.current.status).toBe("running");
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => result.current.stop());
    expect(result.current.status).toBe("idle");
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ completed: false }),
    );
  });

  it("does not save a session shorter than a second", () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("toasts when saving the session fails", async () => {
    mocks.create.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    await act(async () => {
      result.current.stop();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.toast).toHaveBeenCalled();
  });

  it("includes the trimmed task label when saving", () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.setTaskLabel("  Escrever relatorio  "));
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => result.current.stop());
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ taskLabel: "Escrever relatorio" }),
    );
  });

  it("omits the task label when it is blank", () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => result.current.stop());
    expect(mocks.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ taskLabel: expect.anything() }),
    );
  });

  it("completes and notifies when the countdown reaches zero", () => {
    mocks.user = { focusMinutes: 1, breakMinutes: 1 };
    const { result } = renderHook(() => useTimer());
    expect(result.current.remaining).toBe(60);
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(result.current.status).toBe("done");
    expect(mocks.notify).toHaveBeenCalled();
    expect(mocks.chime).toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ completed: true }),
    );
  });

  it("does not chime when a session is interrupted", () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => result.current.stop());
    expect(mocks.chime).not.toHaveBeenCalled();
  });

  it("chains focus into a break and back into focus when auto-cycle is on", () => {
    mocks.user = {
      focusMinutes: 1,
      breakMinutes: 1,
      longBreakMinutes: 2,
      pomodorosUntilLongBreak: 4,
      autoCycle: true,
    };
    const { result } = renderHook(() => useTimer());

    act(() => result.current.start());
    expect(result.current.type).toBe("focus");

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(result.current.status).toBe("running");
    expect(result.current.type).toBe("break");
    expect(result.current.phase).toBe("shortBreak");

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(result.current.status).toBe("running");
    expect(result.current.phase).toBe("focus");
  });

  it("inserts a long break after the configured number of focus sessions", () => {
    mocks.user = {
      focusMinutes: 1,
      breakMinutes: 1,
      longBreakMinutes: 3,
      pomodorosUntilLongBreak: 2,
      autoCycle: true,
    };
    const { result } = renderHook(() => useTimer());

    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(result.current.phase).toBe("shortBreak");

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(result.current.phase).toBe("focus");

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(result.current.phase).toBe("longBreak");
  });

  it("does not chain when auto-cycle is off", () => {
    mocks.user = { focusMinutes: 1, breakMinutes: 1 };
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(result.current.status).toBe("done");
  });

  it("persists the active session and rehydrates it on remount", () => {
    mocks.user = { focusMinutes: 10, breakMinutes: 5 };
    const first = renderHook(() => useTimer());
    act(() => first.result.current.start());
    act(() => {
      vi.advanceTimersByTime(120_000);
    });
    expect(first.result.current.remaining).toBe(480);
    first.unmount();

    const second = renderHook(() => useTimer());
    expect(second.result.current.status).toBe("running");
    expect(second.result.current.type).toBe("focus");
    expect(second.result.current.remaining).toBeLessThanOrEqual(480);
    expect(second.result.current.remaining).toBeGreaterThan(470);
  });

  it("recomputes the remaining time from the real elapsed time on rehydrate", () => {
    mocks.user = { focusMinutes: 10, breakMinutes: 5 };
    const first = renderHook(() => useTimer());
    act(() => first.result.current.start());
    first.unmount();

    act(() => {
      vi.advanceTimersByTime(300_000);
    });

    const second = renderHook(() => useTimer());
    expect(second.result.current.status).toBe("running");
    expect(second.result.current.remaining).toBeLessThanOrEqual(300);
    expect(second.result.current.remaining).toBeGreaterThan(290);
  });

  it("discards an expired persisted session on rehydrate", () => {
    mocks.user = { focusMinutes: 1, breakMinutes: 1 };
    const first = renderHook(() => useTimer());
    act(() => first.result.current.start());
    first.unmount();

    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    const second = renderHook(() => useTimer());
    expect(second.result.current.status).toBe("idle");
    expect(localStorage.getItem("ft_timer_active")).toBeNull();
  });

  it("clears the persisted session when stopped", () => {
    mocks.user = { focusMinutes: 10, breakMinutes: 5 };
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    expect(localStorage.getItem("ft_timer_active")).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => result.current.stop());
    expect(localStorage.getItem("ft_timer_active")).toBeNull();
  });
});
