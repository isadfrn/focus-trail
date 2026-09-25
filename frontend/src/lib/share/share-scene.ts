import type { SpriteFrame, SpriteLayout } from "../../hooks/useSpriteSheet";
import type { CharacterTheme } from "../../types/character";
import {
  resolveBaseline,
  resolveSpriteScale,
  resolveTerrainHeight,
} from "../scene-metrics";

export const SCENE_REFERENCE_HEIGHT = 800;
const MIRROR_BAND_RATIO = 0.6;

type Context2D = CanvasRenderingContext2D;

export interface SceneImages {
  background: HTMLImageElement;
  terrain: HTMLImageElement;
}

export interface SceneSprite {
  image: CanvasImageSource;
  layout: SpriteLayout;
}

export interface SceneGeometry {
  characterTop: number;
  characterBottom: number;
}

export function pickWalkFrame(frames: SpriteFrame[]): SpriteFrame {
  return frames[Math.floor(frames.length / 3)] ?? frames[0];
}

function drawGroundExtension(
  ctx: Context2D,
  terrain: HTMLImageElement,
  tileX: number,
  tileWidth: number,
  groundBottom: number,
  lift: number,
  terrainHeight: number,
): void {
  const imageHeight = terrain.naturalHeight;
  const bandRows = Math.max(1, Math.floor(imageHeight * MIRROR_BAND_RATIO));
  const bandHeight = (bandRows * terrainHeight) / imageHeight;
  let filled = 0;
  let bandIndex = 0;

  while (filled < lift) {
    const drawHeight = Math.min(bandHeight, lift - filled);
    const rowsUsed = Math.max(1, Math.ceil((drawHeight * imageHeight) / terrainHeight));
    const mirrored = bandIndex % 2 === 0;
    const destTop = groundBottom + filled;

    ctx.save();
    if (mirrored) {
      ctx.translate(0, destTop * 2 + drawHeight);
      ctx.scale(1, -1);
    }
    ctx.drawImage(
      terrain,
      0,
      mirrored ? imageHeight - rowsUsed : imageHeight - bandRows,
      terrain.naturalWidth,
      rowsUsed,
      tileX,
      destTop,
      tileWidth,
      drawHeight + 1,
    );
    ctx.restore();

    filled += drawHeight;
    bandIndex += 1;
  }
}

export function drawShareScene(
  ctx: Context2D,
  width: number,
  height: number,
  character: CharacterTheme,
  images: SceneImages,
  sprite: SceneSprite,
  lift: number,
): SceneGeometry {
  const unit = height / SCENE_REFERENCE_HEIGHT;
  const groundBottom = height - lift;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = character.skyColor;
  ctx.fillRect(0, 0, width, height);

  const backgroundTileWidth =
    images.background.naturalWidth * (height / images.background.naturalHeight);
  for (let x = 0; x < width; x += backgroundTileWidth) {
    ctx.drawImage(
      images.background,
      Math.floor(x),
      0,
      Math.ceil(backgroundTileWidth) + 1,
      height,
    );
  }

  const terrainHeight = resolveTerrainHeight(character) * unit;
  const terrainTileWidth =
    images.terrain.naturalWidth * (terrainHeight / images.terrain.naturalHeight);
  const terrainTop = Math.round(groundBottom - terrainHeight);
  for (let x = 0; x < width; x += terrainTileWidth) {
    const tileX = Math.floor(x);
    const tileWidth = Math.ceil(terrainTileWidth) + 1;
    ctx.drawImage(
      images.terrain,
      tileX,
      terrainTop,
      tileWidth,
      Math.ceil(terrainHeight),
    );
    if (lift > 0) {
      drawGroundExtension(
        ctx,
        images.terrain,
        tileX,
        tileWidth,
        groundBottom,
        lift,
        terrainHeight,
      );
    }
  }

  const { contentTop, contentHeight, frames } = sprite.layout;
  const frame = pickWalkFrame(frames);
  const scale = Math.max(
    1,
    Math.round(resolveSpriteScale(character, contentHeight) * unit),
  );
  const drawWidth = frame.width * scale;
  const drawHeight = contentHeight * scale;
  const drawX = Math.round((width - drawWidth) / 2);
  const drawY = Math.round(
    groundBottom - resolveBaseline(character) * unit - drawHeight,
  );
  ctx.drawImage(
    sprite.image,
    frame.x,
    contentTop,
    frame.width,
    contentHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
  );
  ctx.restore();

  return { characterTop: drawY, characterBottom: drawY + drawHeight };
}
