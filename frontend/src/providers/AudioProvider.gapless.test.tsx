import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AudioProvider, useAudio } from "./AudioProvider";

const mocks = vi.hoisted(() => ({
  fallback: false,
}));

vi.mock("../hooks/useGaplessLoop", () => ({
  useGaplessLoop: () => ({ fallback: mocks.fallback }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <AudioProvider>{children}</AudioProvider>;
}

beforeEach(() => {
  mocks.fallback = false;
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("AudioProvider effect playback", () => {
  it("leaves the effect element silent while the gapless loop plays", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play");
    const { result } = renderHook(() => useAudio(), { wrapper });

    act(() => result.current.toggleEffect());

    expect(result.current.effect.playing).toBe(true);
    expect(play).not.toHaveBeenCalled();
  });

  it("plays the effect element when the gapless loop is unavailable", () => {
    mocks.fallback = true;
    const play = vi.spyOn(HTMLMediaElement.prototype, "play");
    const { result } = renderHook(() => useAudio(), { wrapper });

    act(() => result.current.toggleEffect());

    expect(result.current.effect.playing).toBe(true);
    expect(play).toHaveBeenCalled();
  });
});
