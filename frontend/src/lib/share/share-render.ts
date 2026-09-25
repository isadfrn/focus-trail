import { sliceSpriteSheet, type SpriteLayout } from "../../hooks/useSpriteSheet";
import type { CharacterTheme } from "../../types/character";
import { resolveScenePalette } from "../scene-palette";
import type { ShareCardContent, ShareFormat } from "./share-card";
import {
  createCanvas,
  drawBlock,
  drawGlass,
  drawLogo,
  drawPill,
  FONT_FAMILY,
  wrapText,
  type BlockContext,
} from "./share-draw";
import {
  centerPanelY,
  fitLayout,
  resolveBand,
  SHARE_LAYOUTS,
  type ShareLayout,
} from "./share-layout";
import { drawShareScene, type SceneSprite } from "./share-scene";

const MAX_TITLE_LINES = 2;

export interface RenderShareCardInput {
  character: CharacterTheme;
  format: ShareFormat;
  content: ShareCardContent;
  logoUrl: string;
  linkLabel: string;
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      imageCache.delete(url);
      reject(new Error(`share: failed to load image ${url.slice(0, 64)}`));
    };
    image.src = url;
  });
  imageCache.set(url, pending);
  return pending;
}

async function loadSprite(character: CharacterTheme): Promise<SceneSprite> {
  const image = await loadImage(character.sheet);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  let layout: SpriteLayout;
  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("share: no 2d context");
    ctx.drawImage(image, 0, 0);
    const { data } = ctx.getImageData(0, 0, width, height);
    layout = sliceSpriteSheet(data, width, height, character.frames);
  } catch {
    layout = {
      sheetWidth: width,
      sheetHeight: height,
      contentTop: 0,
      contentHeight: height,
      frames: [{ x: 0, width }],
    };
  }
  return { image, layout };
}

function innerWidth(layout: ShareLayout): number {
  return layout.panelWidth - layout.pad * 2;
}

export async function renderShareCard(
  input: RenderShareCardInput,
): Promise<HTMLCanvasElement> {
  const { character, format, content, logoUrl, linkLabel } = input;
  const base = SHARE_LAYOUTS[format.id];
  const palette = resolveScenePalette(character);

  const [background, terrain, sprite, logo] = await Promise.all([
    loadImage(character.background),
    loadImage(character.terrain),
    loadSprite(character),
    loadImage(logoUrl),
  ]);

  const canvas = createCanvas(format.width, format.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("share: canvas 2d context is unavailable");

  const geometry = drawShareScene(
    ctx,
    format.width,
    format.height,
    character,
    { background, terrain },
    sprite,
    base.sceneLift,
  );

  const logoAspect = logo.naturalHeight / logo.naturalWidth;
  if (!base.headerRow) {
    drawLogo(
      ctx,
      logo,
      (format.width - base.logoWidth) / 2,
      base.logoY,
      base.logoWidth,
      base.logoWidth * logoAspect,
      20,
    );
  }

  const band = resolveBand(base, geometry.characterTop, logoAspect);
  const wrapTitle = (layout: ShareLayout): string[] => {
    if (!content.title) return [];
    ctx.save();
    ctx.font = `800 ${layout.title}px ${FONT_FAMILY}`;
    const lines = wrapText(ctx, content.title, innerWidth(layout), MAX_TITLE_LINES);
    ctx.restore();
    return lines;
  };

  const fitted = fitLayout(
    base,
    content,
    band.bottom - band.top,
    (layout) => wrapTitle(layout).length,
  );
  const { layout } = fitted;

  const panelX = (format.width - layout.panelWidth) / 2;
  const panelY = centerPanelY(band, fitted.panelHeight);
  drawGlass(
    ctx,
    canvas,
    { x: panelX, y: panelY, width: layout.panelWidth, height: fitted.panelHeight },
    layout.radius,
    palette,
    layout.blurDivisor,
  );

  const blockContext: BlockContext = {
    ctx,
    content,
    layout,
    palette,
    panelX,
    logo,
    titleLines: wrapTitle(layout),
  };
  let cursor = panelY + layout.pad;
  for (const block of fitted.blocks) {
    drawBlock(block.id, cursor, blockContext);
    cursor += block.height + block.gapAfter;
  }

  drawPill(
    ctx,
    format.width / 2,
    panelY + fitted.panelHeight,
    linkLabel,
    layout,
    palette,
  );

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("share: failed to encode the card as PNG"));
    }, "image/png");
  });
}
