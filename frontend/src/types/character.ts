export interface ScenePalette {
  foreground: string;
  accent: string;
  panel: string;
  panelBorder: string;
  onAccent: string;
}

export interface SpriteGrid {
  columns: number;
  rows: number;
}

export interface CharacterTheme {
  id: string;
  name: string;
  skyColor: string;
  background: string;
  terrain: string;
  sheet: string;
  frames?: number;
  grid?: SpriteGrid;
  height?: number;
  terrainHeight?: number;
  baseline?: number;
  cameraSpeed?: number;
  terrainSpeed?: number;
  spriteSpeed?: number;
  scene?: Partial<ScenePalette>;
}
