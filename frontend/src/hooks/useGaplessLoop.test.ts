import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGaplessLoop } from "./useGaplessLoop";

const mocks = vi.hoisted(() => ({
  supported: true,
  create: vi.fn(),
}));

vi.mock("../lib/gapless-loop", () => ({
  isGaplessLoopSupported: () => mocks.supported,
  createGaplessLoop: () => mocks.create(),
}));

function makeLoop(loadResult: Promise<void> = Promise.resolve()) {
  return {
    load: vi.fn(() => loadResult),
    start: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
    dispose: vi.fn(),
  };
}

beforeEach(() => {
  mocks.supported = true;
  mocks.create.mockReset();
});

describe("useGaplessLoop", () => {
  it("asks for the element fallback when Web Audio is not supported", () => {
    mocks.supported = false;

    const { result } = renderHook(() => useGaplessLoop("rain.mp3", true, 1));

    expect(result.current.fallback).toBe(true);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("does not create the audio context until something plays", () => {
    const { result } = renderHook(() => useGaplessLoop("rain.mp3", false, 1));

    expect(result.current.fallback).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("loads, starts and sets the volume when playing", () => {
    const loop = makeLoop();
    mocks.create.mockReturnValue(loop);

    renderHook(() => useGaplessLoop("rain.mp3", true, 0.4));

    expect(loop.load).toHaveBeenCalledWith("rain.mp3");
    expect(loop.start).toHaveBeenCalled();
    expect(loop.setVolume).toHaveBeenCalledWith(0.4);
  });

  it("stops the loop when playback is paused", () => {
    const loop = makeLoop();
    mocks.create.mockReturnValue(loop);

    const { rerender } = renderHook(
      ({ playing }) => useGaplessLoop("rain.mp3", playing, 1),
      { initialProps: { playing: true } },
    );
    rerender({ playing: false });

    expect(loop.stop).toHaveBeenCalled();
  });

  it("follows a volume change", () => {
    const loop = makeLoop();
    mocks.create.mockReturnValue(loop);

    const { rerender } = renderHook(
      ({ volume }) => useGaplessLoop("rain.mp3", true, volume),
      { initialProps: { volume: 1 } },
    );
    rerender({ volume: 0.2 });

    expect(loop.setVolume).toHaveBeenLastCalledWith(0.2);
  });

  it("loads the new file when the track changes", () => {
    const loop = makeLoop();
    mocks.create.mockReturnValue(loop);

    const { rerender } = renderHook(
      ({ url }) => useGaplessLoop(url, true, 1),
      { initialProps: { url: "rain.mp3" } },
    );
    rerender({ url: "birds.mp3" });

    expect(loop.load).toHaveBeenLastCalledWith("birds.mp3");
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });

  it("falls back to the element when the context cannot be created", () => {
    mocks.create.mockReturnValue(null);

    const { result } = renderHook(() => useGaplessLoop("rain.mp3", true, 1));

    expect(result.current.fallback).toBe(true);
  });

  it("falls back to the element when the file fails to load", async () => {
    const loop = makeLoop(Promise.reject(new Error("decode failed")));
    mocks.create.mockReturnValue(loop);

    const { result } = renderHook(() => useGaplessLoop("rain.mp3", true, 1));

    await vi.waitFor(() => expect(result.current.fallback).toBe(true));
    expect(loop.stop).toHaveBeenCalled();
  });

  it("disposes the loop on unmount", () => {
    const loop = makeLoop();
    mocks.create.mockReturnValue(loop);

    const { unmount } = renderHook(() => useGaplessLoop("rain.mp3", true, 1));
    unmount();

    expect(loop.dispose).toHaveBeenCalled();
  });
});
