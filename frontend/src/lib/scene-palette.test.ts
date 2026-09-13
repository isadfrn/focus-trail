import { describe, expect, it } from "vitest";

import type { CharacterTheme } from "../types/character";
import { resolveScenePalette, sceneVars } from "./scene-palette";

function makeCharacter(overrides: Partial<CharacterTheme> = {}): CharacterTheme {
  return {
    id: "x",
    name: "X",
    skyColor: "#007474",
    background: "bg",
    terrain: "terrain",
    sheet: "sheet",
    ...overrides,
  } as CharacterTheme;
}

describe("scene-palette", () => {
  it("uses the dark preset for a dark sky", () => {
    const palette = resolveScenePalette(makeCharacter({ skyColor: "#007474" }));
    expect(palette.foreground).toBe("#f8eed3");
  });

  it("uses the light preset for a light sky", () => {
    const palette = resolveScenePalette(makeCharacter({ skyColor: "#ffffff" }));
    expect(palette.foreground).toBe("#0b1518");
  });

  it("lets a character override individual palette entries", () => {
    const palette = resolveScenePalette(
      makeCharacter({ scene: { accent: "#123456" } }),
    );
    expect(palette.accent).toBe("#123456");
  });

  it("maps a palette to scene CSS variables", () => {
    const vars = sceneVars(resolveScenePalette(makeCharacter()));
    expect(vars).toHaveProperty("--color-scene-foreground");
    expect(vars).toHaveProperty("--color-scene-accent");
    expect(vars).toHaveProperty("--color-scene-on-accent");
  });
});
