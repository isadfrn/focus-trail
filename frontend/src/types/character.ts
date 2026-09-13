export interface ScenePalette {
  foreground: string;
  accent: string;
  panel: string;
  panelBorder: string;
  onAccent: string;
}

export interface CharacterTheme {
  id: string;
  name: string;
  skyColor: string;
  background: string;
  terrain: string;
  sheet: string;
  frames?: number;
  height?: number;
  terrainHeight?: number;
  baseline?: number;
  cameraSpeed?: number;
  terrainSpeed?: number;
  spriteSpeed?: number;
  scene?: Partial<ScenePalette>;
}
