import { describe, expect, it } from "vitest";

import { effectTracks, musicTracks, nextIndex, prevIndex } from "./tracks";

const AUDIO_EXTENSION = /\.(mp3|ogg|wav|m4a)$/i;

describe("tracks", () => {
  it("loads music and effect tracks from the asset folders", () => {
    expect(musicTracks.length).toBeGreaterThan(0);
    expect(effectTracks.length).toBeGreaterThan(0);
  });

  it("names each track after its file, without the extension", () => {
    for (const track of [...musicTracks, ...effectTracks]) {
      expect(track.url).toBeTruthy();
      expect(track.name).toMatch(/\S/);
      expect(track.name).not.toMatch(AUDIO_EXTENSION);
      expect(track.id).toBe(track.name);
    }
  });

  it("sorts tracks by name", () => {
    const names = musicTracks.map((t) => t.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
    expect(names).toEqual(sorted);
  });

  it("advances and wraps from the last track to the first", () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBe(0);
    expect(nextIndex(0, 0)).toBe(0);
  });

  it("steps back and wraps from the first track to the last", () => {
    expect(prevIndex(2, 3)).toBe(1);
    expect(prevIndex(0, 3)).toBe(2);
    expect(prevIndex(0, 0)).toBe(0);
  });
});
