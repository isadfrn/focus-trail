import { describe, expect, it } from "vitest";

import { effectTracks, musicTracks, nextIndex, prevIndex } from "./tracks";

describe("tracks", () => {
  it("loads the music and effect files dropped into the asset folders", () => {
    expect(musicTracks.length).toBeGreaterThan(0);
    expect(effectTracks.length).toBeGreaterThan(0);
    expect(musicTracks.some((t) => t.id === "lofi1")).toBe(true);
    expect(effectTracks.some((t) => t.id === "rain")).toBe(true);
  });

  it("gives every track a url and a human-readable name", () => {
    for (const t of [...musicTracks, ...effectTracks]) {
      expect(t.url).toBeTruthy();
      expect(t.name).toMatch(/\S/);
    }
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
