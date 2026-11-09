import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HYDRATION_SNOOZE_MINUTES,
  useHydrationReminder,
} from "./useHydrationReminder";

const MINUTE = 60_000;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function advanceMinutes(minutes: number) {
  act(() => {
    vi.advanceTimersByTime(minutes * MINUTE);
  });
}

describe("useHydrationReminder", () => {
  it("never becomes due when the interval is zero", () => {
    const { result } = renderHook(() => useHydrationReminder(0));
    advanceMinutes(600);
    expect(result.current.due).toBe(false);
  });

  it("becomes due once the interval has elapsed", () => {
    const { result } = renderHook(() => useHydrationReminder(30));
    advanceMinutes(29);
    expect(result.current.due).toBe(false);
    advanceMinutes(1);
    expect(result.current.due).toBe(true);
  });

  it("schedules the next reminder a full interval after acknowledging", () => {
    const { result } = renderHook(() => useHydrationReminder(30));
    advanceMinutes(30);
    act(() => result.current.acknowledge());
    expect(result.current.due).toBe(false);
    advanceMinutes(29);
    expect(result.current.due).toBe(false);
    advanceMinutes(1);
    expect(result.current.due).toBe(true);
  });

  it("returns after the snooze delay instead of the full interval", () => {
    const { result } = renderHook(() => useHydrationReminder(60));
    advanceMinutes(60);
    act(() => result.current.snooze());
    expect(result.current.due).toBe(false);
    advanceMinutes(HYDRATION_SNOOZE_MINUTES);
    expect(result.current.due).toBe(true);
  });

  it("does not trigger again while a reminder is still pending acknowledgement", () => {
    const { result } = renderHook(() => useHydrationReminder(10));
    advanceMinutes(10);
    expect(result.current.due).toBe(true);
    advanceMinutes(30);
    expect(result.current.due).toBe(true);
  });

  it("restarts the schedule when the interval changes", () => {
    const { result, rerender } = renderHook(
      ({ minutes }) => useHydrationReminder(minutes),
      { initialProps: { minutes: 10 } },
    );
    advanceMinutes(9);
    rerender({ minutes: 20 });
    advanceMinutes(19);
    expect(result.current.due).toBe(false);
    advanceMinutes(1);
    expect(result.current.due).toBe(true);
  });

  it("clears a pending reminder when the feature is turned off", () => {
    const { result, rerender } = renderHook(
      ({ minutes }) => useHydrationReminder(minutes),
      { initialProps: { minutes: 5 } },
    );
    advanceMinutes(5);
    expect(result.current.due).toBe(true);
    rerender({ minutes: 0 });
    expect(result.current.due).toBe(false);
  });

  it("ignores acknowledge when the feature is off", () => {
    const { result } = renderHook(() => useHydrationReminder(0));
    act(() => result.current.acknowledge());
    advanceMinutes(600);
    expect(result.current.due).toBe(false);
  });

  it("stops checking after unmount", () => {
    const { unmount } = renderHook(() => useHydrationReminder(5));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
