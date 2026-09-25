import { describe, expect, it } from "vitest";

import { characters, defaultCharacter } from "./characters";

describe("characters manifest", () => {
  it("loads at least one scenario and exposes the default", () => {
    expect(characters.length).toBeGreaterThan(0);
    expect(characters).toContain(defaultCharacter);
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
