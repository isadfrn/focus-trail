import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import {
  TimerActivityProvider,
  useTimerActivity,
} from "./TimerActivityProvider";

const wrapper = ({ children }: { children: ReactNode }) => (
  <TimerActivityProvider>{children}</TimerActivityProvider>
);

describe("TimerActivityProvider", () => {
  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useTimerActivity())).toThrow();
  });

  it("toggles the running flag", () => {
    const { result } = renderHook(() => useTimerActivity(), { wrapper });
    expect(result.current.running).toBe(false);
    act(() => result.current.setRunning(true));
    expect(result.current.running).toBe(true);
  });
});
