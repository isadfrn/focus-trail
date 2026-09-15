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

  it("starts music position and duration at zero", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    expect(result.current.music.position).toBe(0);
    expect(result.current.music.duration).toBe(0);
  });

  it("seekMusic updates the position", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.seekMusic(42));
    expect(result.current.music.position).toBe(42);
  });

  it("tracks position and duration from the media element", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    const musicElement = document.querySelectorAll("audio")[0] as HTMLAudioElement;

    act(() => {
      fireEvent.durationChange(musicElement);
    });
    expect(result.current.music.duration).toBe(0);

    Object.defineProperty(musicElement, "currentTime", {
      configurable: true,
      value: 12,
    });
    Object.defineProperty(musicElement, "duration", {
      configurable: true,
      value: 200,
    });
    act(() => {
      fireEvent.timeUpdate(musicElement);
      fireEvent.durationChange(musicElement);
    });
    expect(result.current.music.position).toBe(12);
    expect(result.current.music.duration).toBe(200);
  });

  it("defaults both channel volumes to full", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    expect(result.current.music.volume).toBe(1);
    expect(result.current.effect.volume).toBe(1);
  });

  it("sets, clamps and persists the channel volumes", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });

    act(() => result.current.setMusicVolume(0.3));
    expect(result.current.music.volume).toBe(0.3);
    expect(localStorage.getItem("ft_audio_music_volume")).toBe("0.3");

    act(() => result.current.setEffectVolume(2));
    expect(result.current.effect.volume).toBe(1);

    act(() => result.current.setMusicVolume(-1));
    expect(result.current.music.volume).toBe(0);
  });

  it("applies the volume to the media element", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    const musicElement = document.querySelectorAll("audio")[0] as HTMLAudioElement;
    act(() => result.current.setMusicVolume(0.5));
    expect(musicElement.volume).toBe(0.5);
  });

  it("restores a stored volume on mount", () => {
    localStorage.setItem("ft_audio_music_volume", "0.25");
    const { result } = renderHook(() => useAudio(), { wrapper });
    expect(result.current.music.volume).toBe(0.25);
  });

  it("enables the end-of-session chime by default and persists toggling", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    expect(result.current.chimeEnabled).toBe(true);

    act(() => result.current.setChimeEnabled(false));
    expect(result.current.chimeEnabled).toBe(false);
    expect(localStorage.getItem("ft_audio_chime")).toBe("false");
  });
});
