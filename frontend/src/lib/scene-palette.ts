import type { CSSProperties } from "react";

import type { CharacterTheme, ScenePalette } from "../types/character";
import { isLightColor } from "./color";

const ON_DARK: ScenePalette = {
  foreground: "#f6f5fa",
  accent: "#bfaee2",
  panel: "rgba(23, 19, 31, 0.55)",
  panelBorder: "rgba(255, 255, 255, 0.15)",
  onAccent: "#17131f",
};

const ON_LIGHT: ScenePalette = {
  foreground: "#0e0c14",
  accent: "#6a4da0",
  panel: "rgba(255, 255, 255, 0.62)",
  panelBorder: "rgba(14, 12, 20, 0.12)",
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
