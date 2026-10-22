import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isChimeEnabled,
  persistChimeEnabled,
  playChime,
  playSessionChime,
} from "./chime";

function stubAudio(play: () => Promise<void> = () => Promise.resolve()) {
  const instance = { volume: 1, play: vi.fn(play) };
  const constructor = vi.fn(function () {
    return instance;
  });
  vi.stubGlobal("Audio", constructor);
  return { instance, constructor };
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
  it("plays the cycle-done sound at the requested volume", () => {
    const { instance, constructor } = stubAudio();

    playChime(0.5);

    expect(constructor).toHaveBeenCalledWith(
      expect.stringContaining("cicle-done"),
    );
    expect(instance.volume).toBe(0.5);
    expect(instance.play).toHaveBeenCalled();
  });

  it("swallows playback rejections such as blocked autoplay", async () => {
    stubAudio(() => Promise.reject(new Error("NotAllowedError")));

    expect(() => playChime()).not.toThrow();
    await Promise.resolve();
  });

  it("swallows errors when the Audio API is unavailable", () => {
    vi.stubGlobal("Audio", undefined);

    expect(() => playChime()).not.toThrow();
  });
});

describe("playSessionChime", () => {
  it("skips playback when the chime is disabled", () => {
    const { constructor } = stubAudio();
    persistChimeEnabled(false);

    playSessionChime();

    expect(constructor).not.toHaveBeenCalled();
  });

  it("plays when the chime is enabled", () => {
    const { constructor } = stubAudio();
    persistChimeEnabled(true);

    playSessionChime();

    expect(constructor).toHaveBeenCalled();
  });
});
