import type { ScenePalette } from "../../types/character";
import { hexToRgb } from "../color";
import type { HeroRun, ShareCardContent, ShareGoal, ShareStat } from "./share-card";
import {
  goalLabelOffset,
  heroCapHeight,
  statLabelOffset,
  statNumberCapHeight,
  titleLineHeight,
  type BlockId,
  type ShareLayout,
} from "./share-layout";
import { buildHeroRuns } from "./share-card";

export const FONT_FAMILY =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const KICKER_SPACING_RATIO = 0.22;
const HERO_NUMBER_WEIGHT = 900;
const HERO_UNIT_WEIGHT = 700;
const HERO_GAP_AFTER_NUMBER = 0.05;
const HERO_GAP_AFTER_UNIT = 0.2;
const HEADER_TEXT_BASELINE_RATIO = 0.36;

type Context2D = CanvasRenderingContext2D;
type TextAlign = "left" | "center" | "right";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function withAlpha(color: string, alpha: number): string {
  if (!color.startsWith("#")) return color;
  const [red, green, blue] = hexToRgb(color);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function roundRectPath(
  ctx: Context2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  const corner = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + corner, y);
  ctx.arcTo(x + width, y, x + width, y + height, corner);
  ctx.arcTo(x + width, y + height, x, y + height, corner);
  ctx.arcTo(x, y + height, x, y, corner);
  ctx.arcTo(x, y, x + width, y, corner);
  ctx.closePath();
}

function splitToFit(
  ctx: Pick<Context2D, "measureText">,
  word: string,
  maxWidth: number,
): string[] {
  if (ctx.measureText(word).width <= maxWidth) return [word];
  const chunks: string[] = [];
  let chunk = "";
  for (const glyph of Array.from(word)) {
    if (chunk && ctx.measureText(chunk + glyph).width > maxWidth) {
      chunks.push(chunk);
      chunk = glyph;
    } else {
      chunk += glyph;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

export function wrapText(
  ctx: Pick<Context2D, "measureText">,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const tokens = text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => splitToFit(ctx, word, maxWidth));

  const lines: string[] = [];
  let line = "";
  for (const token of tokens) {
    const candidate = line ? `${line} ${token}` : token;
    if (!line || ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = token;
    }
  }
  if (line) lines.push(line);

  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
    last = last.slice(0, -1);
  }
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

export function drawSpacedText(
  ctx: Context2D,
  text: string,
  x: number,
  baseline: number,
  spacing: number,
  align: TextAlign,
): void {
  const glyphs = Array.from(text);
  const widths = glyphs.map((glyph) => ctx.measureText(glyph).width);
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    spacing * Math.max(0, glyphs.length - 1);
  let cursor = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  ctx.textAlign = "left";
  glyphs.forEach((glyph, index) => {
    ctx.fillText(glyph, cursor, baseline);
    cursor += widths[index] + spacing;
  });
}

export function blurredCopy(
  source: HTMLCanvasElement,
  rect: Rect,
  divisor: number,
): HTMLCanvasElement {
  const targetWidth = Math.max(2, Math.round(rect.width / divisor));
  const targetHeight = Math.max(2, Math.round(rect.height / divisor));
  let current = createCanvas(rect.width, rect.height);
  current
    .getContext("2d")
    ?.drawImage(
      source,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      current.width,
      current.height,
    );
  while (current.width / 2 >= targetWidth && current.height / 2 >= targetHeight) {
    const next = createCanvas(current.width / 2, current.height / 2);
    const nextCtx = next.getContext("2d");
    if (nextCtx) {
      nextCtx.imageSmoothingEnabled = true;
      nextCtx.imageSmoothingQuality = "high";
      nextCtx.drawImage(current, 0, 0, next.width, next.height);
    }
    current = next;
  }
  return current;
}

export function drawGlass(
  ctx: Context2D,
  canvas: HTMLCanvasElement,
  rect: Rect,
  radius: number,
  palette: ScenePalette,
  blurDivisor: number,
): void {
  const blurred = blurredCopy(canvas, rect, blurDivisor);
  ctx.save();
  roundRectPath(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    blurred,
    0,
    0,
    blurred.width,
    blurred.height,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  );
  ctx.fillStyle = palette.panel;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = palette.panelBorder;
  roundRectPath(
    ctx,
    rect.x + 1.5,
    rect.y + 1.5,
    rect.width - 3,
    rect.height - 3,
    radius - 1.5,
  );
  ctx.stroke();
  ctx.restore();
}

interface HeroSizes {
  number: number;
  unit: number;
}

function heroFont(run: HeroRun, sizes: HeroSizes): string {
  return run.unit
    ? `${HERO_UNIT_WEIGHT} ${sizes.unit}px ${FONT_FAMILY}`
    : `${HERO_NUMBER_WEIGHT} ${sizes.number}px ${FONT_FAMILY}`;
}

function heroGap(run: HeroRun, sizes: HeroSizes): number {
  return sizes.number * (run.unit ? HERO_GAP_AFTER_UNIT : HERO_GAP_AFTER_NUMBER);
}

export function measureHero(
  ctx: Pick<Context2D, "measureText"> & { font: string },
  runs: HeroRun[],
  sizes: HeroSizes,
): number {
  return runs.reduce((width, run, index) => {
    ctx.font = heroFont(run, sizes);
    const gap = index < runs.length - 1 ? heroGap(run, sizes) : 0;
    return width + ctx.measureText(run.text).width + gap;
  }, 0);
}

export function drawHero(
  ctx: Context2D,
  seconds: number,
  centerX: number,
  baseline: number,
  layout: ShareLayout,
  palette: ScenePalette,
  maxWidth: number,
): void {
  const runs = buildHeroRuns(seconds);
  let sizes: HeroSizes = { number: layout.hero, unit: layout.heroUnit };
  let total = measureHero(ctx, runs, sizes);
  if (total > maxWidth) {
    const factor = maxWidth / total;
    sizes = { number: sizes.number * factor, unit: sizes.unit * factor };
    total = measureHero(ctx, runs, sizes);
  }

  ctx.save();
  ctx.textAlign = "left";
  ctx.shadowColor = "rgba(11, 21, 24, 0.35)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 4;
  let cursor = centerX - total / 2;
  runs.forEach((run, index) => {
    ctx.font = heroFont(run, sizes);
    ctx.fillStyle = run.unit ? palette.accent : palette.foreground;
    ctx.fillText(run.text, cursor, baseline);
    cursor += ctx.measureText(run.text).width;
    if (index < runs.length - 1) cursor += heroGap(run, sizes);
  });
  ctx.restore();
}

export function drawGoalBar(
  ctx: Context2D,
  top: number,
  left: number,
  width: number,
  layout: ShareLayout,
  palette: ScenePalette,
  goal: ShareGoal,
): void {
  const radius = layout.goalBar / 2;
  ctx.save();
  ctx.fillStyle = withAlpha(palette.foreground, 0.2);
  roundRectPath(ctx, left, top, width, layout.goalBar, radius);
  ctx.fill();
  ctx.fillStyle = palette.accent;
  roundRectPath(
    ctx,
    left,
    top,
    Math.max(layout.goalBar, width * goal.ratio),
    layout.goalBar,
    radius,
  );
  ctx.fill();

  ctx.font = `600 ${layout.goalText}px ${FONT_FAMILY}`;
  ctx.fillStyle = withAlpha(palette.foreground, 0.85);
  const baseline = top + layout.goalBar + goalLabelOffset() + layout.goalText * 0.8;
  ctx.textAlign = "left";
  ctx.fillText(goal.leftLabel, left, baseline);
  ctx.textAlign = "right";
  ctx.fillText(goal.rightLabel, left + width, baseline);
  ctx.restore();
}

export function drawStatsRow(
  ctx: Context2D,
  top: number,
  left: number,
  width: number,
  layout: ShareLayout,
  palette: ScenePalette,
  stats: ShareStat[],
): void {
  const columnWidth = width / stats.length;
  const numberCap = statNumberCapHeight(layout);
  ctx.save();
  ctx.textAlign = "center";
  stats.forEach((stat, index) => {
    const centerX = left + columnWidth * (index + 0.5);
    let size = layout.statNumber;
    ctx.font = `800 ${size}px ${FONT_FAMILY}`;
    const measured = ctx.measureText(stat.value).width;
    const limit = columnWidth - 36;
    if (measured > limit) size *= limit / measured;
    ctx.font = `800 ${size}px ${FONT_FAMILY}`;
    ctx.fillStyle = palette.foreground;
    ctx.fillText(stat.value, centerX, top + numberCap);

    ctx.font = `500 ${layout.statLabel}px ${FONT_FAMILY}`;
    ctx.fillStyle = withAlpha(palette.foreground, 0.76);
    ctx.fillText(
      stat.label,
      centerX,
      top + numberCap + statLabelOffset() + layout.statLabel * 0.8,
    );

    if (index > 0) {
      ctx.fillStyle = withAlpha(palette.foreground, 0.16);
      ctx.fillRect(
        left + columnWidth * index - 1,
        top + 6,
        2,
        numberCap + statLabelOffset() + layout.statLabel - 6,
      );
    }
  });
  ctx.restore();
}

export function drawPill(
  ctx: Context2D,
  centerX: number,
  centerY: number,
  text: string,
  layout: ShareLayout,
  palette: ScenePalette,
): void {
  ctx.save();
  ctx.font = `700 ${layout.pillText}px ${FONT_FAMILY}`;
  const width = ctx.measureText(text).width + layout.pillText * 2.2;
  const height = layout.pillHeight;
  ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = palette.accent;
  roundRectPath(ctx, centerX - width / 2, centerY - height / 2, width, height, height / 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = palette.onAccent;
  ctx.textAlign = "center";
  ctx.fillText(text, centerX, centerY + layout.pillText * 0.35);
  ctx.restore();
}

export function drawLogo(
  ctx: Context2D,
  logo: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  shadowBlur: number,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetY = shadowBlur / 3;
  ctx.drawImage(logo, x, y, width, height);
  ctx.restore();
}

export interface BlockContext {
  ctx: Context2D;
  content: ShareCardContent;
  layout: ShareLayout;
  palette: ScenePalette;
  panelX: number;
  logo: HTMLImageElement;
  titleLines: string[];
}

function drawKicker(
  block: BlockContext,
  x: number,
  baseline: number,
  align: TextAlign,
): void {
  const { ctx, layout, palette, content } = block;
  ctx.save();
  ctx.font = `800 ${layout.kicker}px ${FONT_FAMILY}`;
  ctx.fillStyle = palette.accent;
  drawSpacedText(ctx, content.kicker, x, baseline, layout.kicker * KICKER_SPACING_RATIO, align);
  ctx.restore();
}

function drawHeaderRow(block: BlockContext, top: number): void {
  const { ctx, layout, palette, content, panelX, logo } = block;
  const left = panelX + layout.pad;
  const right = panelX + layout.panelWidth - layout.pad;
  const logoWidth = (layout.logoHeight * logo.naturalWidth) / logo.naturalHeight;
  drawLogo(ctx, logo, left, top, logoWidth, layout.logoHeight, 12);

  if (content.kind === "day" && content.subtitle) {
    const kickerBaseline = top + layout.logoHeight * HEADER_TEXT_BASELINE_RATIO;
    drawKicker(block, right, kickerBaseline, "right");
    ctx.save();
    ctx.font = `500 ${layout.subtitle}px ${FONT_FAMILY}`;
    ctx.fillStyle = withAlpha(palette.foreground, 0.8);
    ctx.textAlign = "right";
    ctx.fillText(content.subtitle, right, kickerBaseline + layout.subtitle * 1.25);
    ctx.restore();
    return;
  }
  drawKicker(block, right, top + layout.logoHeight * 0.58, "right");
}

export function drawBlock(id: BlockId, top: number, block: BlockContext): void {
  const { ctx, layout, palette, content, panelX, titleLines } = block;
  const centerX = panelX + layout.panelWidth / 2;
  const left = panelX + layout.pad;
  const innerWidth = layout.panelWidth - layout.pad * 2;

  switch (id) {
    case "header":
      drawHeaderRow(block, top);
      return;
    case "kicker":
      drawKicker(block, centerX, top + layout.kicker * 0.8, "center");
      return;
    case "subtitle":
      ctx.save();
      ctx.font = `500 ${layout.subtitle}px ${FONT_FAMILY}`;
      ctx.fillStyle = withAlpha(palette.foreground, 0.8);
      ctx.textAlign = "center";
      ctx.fillText(content.subtitle ?? "", centerX, top + layout.subtitle * 0.8);
      ctx.restore();
      return;
    case "title": {
      const lineHeight = titleLineHeight(layout);
      ctx.save();
      ctx.font = `800 ${layout.title}px ${FONT_FAMILY}`;
      ctx.fillStyle = palette.foreground;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(11, 21, 24, 0.25)";
      ctx.shadowBlur = 14;
      titleLines.forEach((line, index) =>
        ctx.fillText(line, centerX, top + index * lineHeight + layout.title * 0.82),
      );
      ctx.restore();
      return;
    }
    case "hero":
      drawHero(
        ctx,
        content.seconds,
        centerX,
        top + heroCapHeight(layout),
        layout,
        palette,
        innerWidth,
      );
      return;
    case "caption":
      ctx.save();
      ctx.font = `500 ${layout.caption}px ${FONT_FAMILY}`;
      ctx.fillStyle = withAlpha(palette.foreground, 0.8);
      ctx.textAlign = "center";
      ctx.fillText(content.heroCaption ?? "", centerX, top + layout.caption * 0.8);
      ctx.restore();
      return;
    case "goal":
      if (content.goal) drawGoalBar(ctx, top, left, innerWidth, layout, palette, content.goal);
      return;
    case "divider":
      ctx.fillStyle = withAlpha(palette.foreground, 0.18);
      ctx.fillRect(left, top, innerWidth, 2);
      return;
    case "stats":
      drawStatsRow(ctx, top, left, innerWidth, layout, palette, content.stats);
      return;
  }
}
