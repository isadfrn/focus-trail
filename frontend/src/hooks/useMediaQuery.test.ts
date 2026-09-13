import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMediaQuery } from "./useMediaQuery";

function mockMatchMedia(initial: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches: initial,
    media: "",
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return {
    set(value: boolean) {
      mql.matches = value;
      listeners.forEach((cb) => cb());
    },
  };
}

const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
  vi.restoreAllMocks();
});

describe("useMediaQuery", () => {
  it("returns the initial match state", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(result.current).toBe(true);
  });

  it("updates when the media query changes", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(result.current).toBe(false);
    act(() => media.set(true));
    expect(result.current).toBe(true);
  });
});
