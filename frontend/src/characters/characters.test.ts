import { describe, expect, it } from "vitest";

import {
  characters,
  defaultCharacter,
  toCharacterTheme,
  type RawScenario,
} from "./characters";

const baseScenario: RawScenario = {
  id: "legacy-strip",
  name: "Legacy strip",
  skyColor: "#8ec7ff",
  background: "japan-street-sunny.jpeg",
  terrain: "concrete.png",
  sheet: "female-japanese-student.png",
};

describe("characters manifest", () => {
  it("loads at least one scenario and exposes the default", () => {
    expect(characters.length).toBeGreaterThan(0);
    expect(characters).toContain(defaultCharacter);
  });

  it("keeps the female japanese student as the default scenario", () => {
    expect(defaultCharacter.id).toBe("female-japanese-student");
    expect(defaultCharacter.grid).toEqual({ columns: 3, rows: 3 });
  });

  it.each(characters.map((character) => [character.id, character] as const))(
    "scenario %s has a valid sky color and resolved assets",
    (_id, character) => {
      expect(character.skyColor).toMatch(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
      expect(character.background).toBeTruthy();
      expect(character.terrain).toBeTruthy();
      expect(character.sheet).toBeTruthy();
    },
  );
});

describe("toCharacterTheme", () => {
  it("accepts a horizontal strip scenario without a grid", () => {
    const theme = toCharacterTheme({ ...baseScenario, frames: 4 });

    expect(theme.frames).toBe(4);
    expect(theme.grid).toBeUndefined();
  });

  it("accepts a horizontal strip scenario with auto-detected frames", () => {
    const theme = toCharacterTheme(baseScenario);

    expect(theme.frames).toBeUndefined();
    expect(theme.grid).toBeUndefined();
  });

  it("accepts a grid scenario", () => {
    const theme = toCharacterTheme({
      ...baseScenario,
      grid: { columns: 3, rows: 2 },
    });

    expect(theme.grid).toEqual({ columns: 3, rows: 2 });
  });

  it("rejects combining frames with a grid", () => {
    expect(() =>
      toCharacterTheme({
        ...baseScenario,
        frames: 4,
        grid: { columns: 2, rows: 2 },
      }),
    ).toThrow('use either "frames"');
  });

  it.each([
    ["columns", { columns: 0, rows: 3 }],
    ["rows", { columns: 3, rows: 1.5 }],
  ])("rejects an invalid grid %s", (field, grid) => {
    expect(() => toCharacterTheme({ ...baseScenario, grid })).toThrow(
      `"grid.${field}" must be an integer >= 1`,
    );
  });
});
