import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isChimeEnabled,
  persistChimeEnabled,
  playChime,
  playSessionChime,
} from "./chime";

function fakeAudioContext() {
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
  const oscillator = {
    type: "",
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as null | (() => void),
  };
  return {
    currentTime: 0,
    createGain: vi.fn(() => gain),
    createOscillator: vi.fn(() => oscillator),
    destination: {},
    close: vi.fn(),
    gain,
    oscillator,
  };
}

function stubAudioContext(context = fakeAudioContext()) {
  const constructor = vi.fn(function (this: Record<string, unknown>) {
    Object.assign(this, context);
  });
  vi.stubGlobal("AudioContext", constructor);
  return { context, constructor };
}

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("chime preference", () => {
  it("is enabled by default", () => {
    expect(isChimeEnabled()).toBe(true);
  });

  it("reflects the stored preference", () => {
    persistChimeEnabled(false);
    expect(isChimeEnabled()).toBe(false);
    persistChimeEnabled(true);
    expect(isChimeEnabled()).toBe(true);
  });
});

describe("playChime", () => {
  it("does nothing when the Web Audio API is unavailable", () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", undefined);
    expect(() => playChime()).not.toThrow();
  });

  it("plays a beep through an oscillator when available", () => {
    const { context, constructor } = stubAudioContext();

    playChime(0.5);

    expect(constructor).toHaveBeenCalled();
    expect(context.createOscillator).toHaveBeenCalled();
    expect(context.oscillator.connect).toHaveBeenCalledWith(context.gain);
    expect(context.gain.connect).toHaveBeenCalledWith(context.destination);
    expect(context.oscillator.start).toHaveBeenCalled();
    expect(context.oscillator.stop).toHaveBeenCalled();
  });

  it("closes the context when the beep ends", () => {
    const { context } = stubAudioContext();

    playChime();
    context.oscillator.onended?.();

    expect(context.close).toHaveBeenCalled();
  });

  it("swallows Web Audio errors", () => {
    const constructor = vi.fn(function (this: Record<string, unknown>) {
      this.createOscillator = () => {
        throw new Error("boom");
      };
      this.createGain = vi.fn();
      this.currentTime = 0;
    });
    vi.stubGlobal("AudioContext", constructor);

    expect(() => playChime()).not.toThrow();
  });
});

describe("playSessionChime", () => {
  it("skips playback when the chime is disabled", () => {
    const { constructor } = stubAudioContext();
    persistChimeEnabled(false);

    playSessionChime();

    expect(constructor).not.toHaveBeenCalled();
  });

  it("plays when the chime is enabled", () => {
    const { constructor } = stubAudioContext();
    persistChimeEnabled(true);

    playSessionChime();

    expect(constructor).toHaveBeenCalled();
  });
});
