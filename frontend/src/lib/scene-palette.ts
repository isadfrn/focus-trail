import type { CSSProperties } from "react";

import type { CharacterTheme, ScenePalette } from "../types/character";
import { isLightColor } from "./color";

/** Fundo escuro (teal, noite, floresta): texto claro sobre painel escuro. */
const ON_DARK: ScenePalette = {
  foreground: "#f8eed3", // tuscan-sun-100
  accent: "#e4ba4e", // tuscan-sun-400
  panel: "rgba(16, 30, 35, 0.55)", // charcoal-blue-900 @ 55%
  panelBorder: "rgba(255, 255, 255, 0.15)",
  onAccent: "#101e23", // charcoal-blue-900
};

/** Fundo claro (ceu de dia, deserto, neve): texto escuro sobre painel claro. */
const ON_LIGHT: ScenePalette = {
  foreground: "#0b1518", // charcoal-blue-950
  accent: "#20796f", // verdigris-700
  panel: "rgba(255, 255, 255, 0.62)",
  panelBorder: "rgba(11, 21, 24, 0.12)",
  onAccent: "#ffffff",
};

/**
 * Deriva a paleta da cena a partir do `skyColor` do personagem e aplica os
 * overrides declarados em `character.scene`. Todo background novo ganha cores
 * legiveis so ajustando o `skyColor`; o override e para direcao de arte.
 */
export function resolveScenePalette(character: CharacterTheme): ScenePalette {
  const base = isLightColor(character.skyColor) ? ON_LIGHT : ON_DARK;
  return { ...base, ...character.scene };
}

/** Converte a paleta em variaveis CSS para aplicar no wrapper da cena. */
export function sceneVars(p: ScenePalette): CSSProperties {
  return {
    "--color-scene-foreground": p.foreground,
    "--color-scene-accent": p.accent,
    "--color-scene-panel": p.panel,
    "--color-scene-panel-border": p.panelBorder,
    "--color-scene-on-accent": p.onAccent,
  } as CSSProperties;
}
