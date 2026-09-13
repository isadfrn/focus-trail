import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: null as { focusMinutes?: number; breakMinutes?: number } | null,
  setRunning: vi.fn(),
  toast: vi.fn(),
  create: vi.fn(),
  notify: vi.fn(),
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

import { useTimer } from "./useTimer";

beforeEach(() => {
  vi.useFakeTimers();
  mocks.user = null;
  mocks.create.mockResolvedValue({});
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
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
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ completed: true }),
    );
  });
});
