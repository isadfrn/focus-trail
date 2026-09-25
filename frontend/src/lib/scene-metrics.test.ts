import { describe, expect, it } from "vitest";

import type { CharacterTheme } from "../types/character";
import {
  DEFAULT_TERRAIN_HEIGHT,
  GROUND_OVERLAP,
  resolveBaseline,
  resolveSpriteScale,
  resolveTerrainHeight,
} from "./scene-metrics";

function makeCharacter(overrides: Partial<CharacterTheme> = {}): CharacterTheme {
  return {
    id: "x",
    name: "X",
    skyColor: "#000000",
    background: "bg",
    terrain: "terrain",
    sheet: "sheet",
    ...overrides,
  };
}

describe("scene-metrics", () => {
  it("falls back to the default terrain height", () => {
    expect(resolveTerrainHeight(makeCharacter())).toBe(DEFAULT_TERRAIN_HEIGHT);
  });

  it("uses the scenario terrain height when provided", () => {
    expect(resolveTerrainHeight(makeCharacter({ terrainHeight: 450 }))).toBe(450);
  });

  it("derives the baseline from the terrain height minus the overlap", () => {
    expect(resolveBaseline(makeCharacter({ terrainHeight: 100 }))).toBe(
      100 - GROUND_OVERLAP,
    );
  });

  it("prefers an explicit baseline", () => {
    expect(resolveBaseline(makeCharacter({ baseline: 54 }))).toBe(54);
  });

  it("rounds the default sprite scale to a whole number of at least one", () => {
    expect(resolveSpriteScale(makeCharacter(), 47)).toBe(2);
    expect(resolveSpriteScale(makeCharacter(), 400)).toBe(1);
  });

  it("scales to an explicit character height", () => {
    expect(resolveSpriteScale(makeCharacter({ height: 120 }), 40)).toBe(3);
  });
});
