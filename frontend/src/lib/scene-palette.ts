import type { CSSProperties } from "react";

import type { CharacterTheme, ScenePalette } from "../types/character";
import { isLightColor } from "./color";

const ON_DARK: ScenePalette = {
  foreground: "#f8eed3",
  accent: "#e4ba4e",
  panel: "rgba(16, 30, 35, 0.55)",
  panelBorder: "rgba(255, 255, 255, 0.15)",
  onAccent: "#101e23",
};

const ON_LIGHT: ScenePalette = {
  foreground: "#0b1518",
  accent: "#20796f",
  panel: "rgba(255, 255, 255, 0.62)",
  panelBorder: "rgba(11, 21, 24, 0.12)",
  onAccent: "#ffffff",
};

export function resolveScenePalette(character: CharacterTheme): ScenePalette {
  const base = isLightColor(character.skyColor) ? ON_LIGHT : ON_DARK;
  return { ...base, ...character.scene };
}

export function sceneVars(p: ScenePalette): CSSProperties {
  return {
    "--color-scene-foreground": p.foreground,
    "--color-scene-accent": p.accent,
    "--color-scene-panel": p.panel,
    "--color-scene-panel-border": p.panelBorder,
    "--color-scene-on-accent": p.onAccent,
  } as CSSProperties;
}
