import { act, fireEvent, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { musicTracks } from "../lib/tracks";
import { AudioProvider, useAudio } from "./AudioProvider";

function wrapper({ children }: { children: ReactNode }) {
  return <AudioProvider>{children}</AudioProvider>;
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("AudioProvider", () => {
  it("throws when useAudio is used outside the provider", () => {
    expect(() => renderHook(() => useAudio())).toThrow();
  });

  it("starts paused with music and effect pre-selected", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    expect(result.current.music.playing).toBe(false);
    expect(result.current.effect.playing).toBe(false);
    expect(result.current.music.current).not.toBeNull();
    expect(result.current.effect.current).not.toBeNull();
  });

  it("toggles music play/pause and calls play()", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play");
    const { result } = renderHook(() => useAudio(), { wrapper });

    act(() => result.current.toggleMusic());
    expect(result.current.music.playing).toBe(true);
    expect(play).toHaveBeenCalled();

    act(() => result.current.toggleMusic());
    expect(result.current.music.playing).toBe(false);
  });

  it("plays music and noise independently and together", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.toggleMusic());
    act(() => result.current.toggleEffect());
    expect(result.current.music.playing).toBe(true);
    expect(result.current.effect.playing).toBe(true);
  });

  it("persists the music and effect selection to storage", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    expect(localStorage.getItem("ft_audio_music")).toBe(
      result.current.music.current?.id,
    );
    expect(localStorage.getItem("ft_audio_effect")).toBe(
      result.current.effect.current?.id,
    );
  });

  it("ignores an unknown id on selectMusic", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    const before = result.current.music.current?.id;
    act(() => result.current.selectMusic("does-not-exist"));
    expect(result.current.music.current?.id).toBe(before);
  });

  it("follows the playlist when a track ends (a single track restarts)", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play");
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.toggleMusic());
    play.mockClear();

    const musicElement = document.querySelectorAll("audio")[0] as HTMLAudioElement;
    act(() => {
      fireEvent.ended(musicElement);
    });
    expect(play).toHaveBeenCalled();
  });

  it("cycles with nextMusic and prevMusic", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.nextMusic());
    act(() => result.current.prevMusic());
    expect(result.current.music.current).not.toBeNull();
  });

  it("switches to a valid track while playing", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.toggleMusic());
    const id = result.current.music.current?.id ?? "";
    act(() => result.current.selectMusic(id));
    expect(result.current.music.playing).toBe(true);
    expect(result.current.music.current?.id).toBe(id);
  });

  it("selects and toggles the effect on and off", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    const id = result.current.effect.current?.id ?? "";
    act(() => result.current.selectEffect(id));
    act(() => result.current.toggleEffect());
    expect(result.current.effect.playing).toBe(true);
    act(() => result.current.toggleEffect());
    expect(result.current.effect.playing).toBe(false);
  });

  it("restores a stored selection on mount", () => {
    localStorage.setItem("ft_audio_music", musicTracks[0].id);
    const { result } = renderHook(() => useAudio(), { wrapper });
    expect(result.current.music.current?.id).toBe(musicTracks[0].id);
  });

  it("falls back to the first track when the stored id is gone", () => {
    localStorage.setItem("ft_audio_music", "removed-track");
    const { result } = renderHook(() => useAudio(), { wrapper });
    expect(result.current.music.current?.id).toBe(musicTracks[0].id);
  });
});
