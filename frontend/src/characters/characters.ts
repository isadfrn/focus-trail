import manifest from "../assets/scenarios.json";
import type { CharacterTheme, ScenePalette } from "../types/character";

interface RawScenario {
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

interface Manifest {
  default: string;
  scenarios: RawScenario[];
}

const backgroundPool = toFilenameMap(
  import.meta.glob("../assets/background/*.{png,gif,webp,jpg,jpeg,svg}", {
    eager: true,
    import: "default",
  }) as Record<string, string>,
);
const characterPool = toFilenameMap(
  import.meta.glob("../assets/character/*.{png,gif,webp,jpg,jpeg,svg}", {
    eager: true,
    import: "default",
  }) as Record<string, string>,
);
const terrainPool = toFilenameMap(
  import.meta.glob("../assets/terrain/*.{png,gif,webp,jpg,jpeg,svg}", {
    eager: true,
    import: "default",
  }) as Record<string, string>,
);

function toFilenameMap(glob: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [path, url] of Object.entries(glob)) {
    const filename = path.split("/").pop();
    if (filename) map[filename] = url;
  }
  return map;
}

function resolveAsset(
  pool: Record<string, string>,
  filename: string,
  poolName: string,
  scenarioId: string,
): string {
  const url = pool[filename];
  if (!url) {
    const available = Object.keys(pool).sort().join(", ") || "(vazio)";
    throw new Error(
      `[scenarios] Cenario "${scenarioId}": arquivo "${filename}" nao existe em ` +
        `assets/${poolName}/. Disponiveis: ${available}`,
    );
  }
  return url;
}

function toCharacterTheme(raw: RawScenario): CharacterTheme {
  const where = `Cenario "${raw.id ?? "(sem id)"}"`;

  if (!raw.id) throw new Error(`[scenarios] ${where}: campo "id" obrigatorio.`);
  if (!raw.name)
    throw new Error(`[scenarios] ${where}: campo "name" obrigatorio.`);
  if (!raw.background)
    throw new Error(`[scenarios] ${where}: campo "background" obrigatorio.`);
  if (!raw.terrain)
    throw new Error(`[scenarios] ${where}: campo "terrain" obrigatorio.`);
  if (!raw.sheet)
    throw new Error(
      `[scenarios] ${where}: campo "sheet" obrigatorio (o sprite sheet do personagem).`,
    );
  if (raw.frames !== undefined && (!Number.isInteger(raw.frames) || raw.frames < 1))
    throw new Error(`[scenarios] ${where}: "frames" precisa ser um inteiro >= 1.`);
  for (const field of ["height", "terrainHeight", "baseline"] as const) {
    const value = raw[field];
    if (value !== undefined && value <= 0)
      throw new Error(`[scenarios] ${where}: "${field}" precisa ser positivo.`);
  }
  for (const field of ["cameraSpeed", "terrainSpeed", "spriteSpeed"] as const) {
    const value = raw[field];
    if (value !== undefined && value <= 0)
      throw new Error(
        `[scenarios] ${where}: "${field}" precisa ser positivo (multiplicador).`,
      );
  }

  return {
    id: raw.id,
    name: raw.name,
    skyColor: raw.skyColor,
    background: resolveAsset(backgroundPool, raw.background, "background", raw.id),
    terrain: resolveAsset(terrainPool, raw.terrain, "terrain", raw.id),
    sheet: resolveAsset(characterPool, raw.sheet, "character", raw.id),
    frames: raw.frames,
    height: raw.height,
    terrainHeight: raw.terrainHeight,
    baseline: raw.baseline,
    cameraSpeed: raw.cameraSpeed,
    terrainSpeed: raw.terrainSpeed,
    spriteSpeed: raw.spriteSpeed,
    scene: raw.scene,
  };
}

const { default: defaultId, scenarios: rawScenarios } = manifest as Manifest;

export const characters: CharacterTheme[] = rawScenarios.map(toCharacterTheme);

const seen = new Set<string>();
for (const c of characters) {
  if (seen.has(c.id))
    throw new Error(`[scenarios] id duplicado: "${c.id}".`);
  seen.add(c.id);
}

export const defaultCharacter: CharacterTheme =
  characters.find((c) => c.id === defaultId) ?? characters[0];

if (!defaultCharacter)
  throw new Error("[scenarios] scenarios.json nao tem nenhum cenario.");
