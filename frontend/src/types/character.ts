export interface ScenePalette {
  /** Cor principal do relogio e rotulos sobre a cena. */
  foreground: string;
  /** Cor de destaque (rodando / preset selecionado). */
  accent: string;
  /** Painel translucido atras dos controles (rgba, ja com alpha). */
  panel: string;
  /** Borda das pilulas e paineis (rgba, ja com alpha). */
  panelBorder: string;
  /** Cor do texto/icone por cima do accent (label do botao Iniciar). */
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
  /**
   * Sobrescreve a paleta da cena. Por padrao ela e derivada do `skyColor`
   * (claro -> texto escuro, escuro -> texto claro). Defina so os campos que
   * quiser fixar; o resto continua automatico.
   */
  scene?: Partial<ScenePalette>;
}
