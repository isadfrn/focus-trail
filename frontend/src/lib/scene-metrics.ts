import type { CharacterTheme } from "../types/character";

export const DEFAULT_TERRAIN_HEIGHT = 96;
export const DEFAULT_SPRITE_HEIGHT = 90;
export const GROUND_OVERLAP = 2;

export function resolveTerrainHeight(character: CharacterTheme): number {
  return character.terrainHeight ?? DEFAULT_TERRAIN_HEIGHT;
}

export function resolveBaseline(character: CharacterTheme): number {
  return character.baseline ?? resolveTerrainHeight(character) - GROUND_OVERLAP;
}

export function resolveSpriteScale(
  character: CharacterTheme,
  contentHeight: number,
): number {
  return character.height
    ? character.height / contentHeight
    : Math.max(1, Math.round(DEFAULT_SPRITE_HEIGHT / contentHeight));
}
