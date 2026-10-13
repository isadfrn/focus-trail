import { useEffect, useState } from "react";

import type { SpriteGrid } from "../types/character";

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
}

export interface SpriteLayout {
  sheetWidth: number;
  sheetHeight: number;
  contentHeight: number;
  frames: SpriteFrame[];
}

export interface SpriteSlicing {
  frameCount?: number;
  grid?: SpriteGrid;
}

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface InkBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const ALPHA_THRESHOLD = 8;

export function wholeSheetLayout(width: number, height: number): SpriteLayout {
  return {
    sheetWidth: width,
    sheetHeight: height,
    contentHeight: height,
    frames: [{ x: 0, y: 0, width }],
  };
}

function measureInk(
  data: Uint8ClampedArray,
  sheetWidth: number,
  region: Region,
): InkBounds | null {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (let y = region.y; y < region.y + region.height; y++) {
    for (let x = region.x; x < region.x + region.width; x++) {
      if (data[(y * sheetWidth + x) * 4 + 3] <= ALPHA_THRESHOLD) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  return right < left ? null : { left, top, right, bottom };
}

function sliceStrip(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  frameCount?: number,
): SpriteLayout {
  const bounds = measureInk(data, width, { x: 0, y: 0, width, height });
  const contentTop = bounds?.top ?? 0;
  const contentBottom = bounds?.bottom ?? height - 1;

  const columnHasInk = (x: number) =>
    measureInk(data, width, { x, y: 0, width: 1, height }) !== null;

  let frames: SpriteFrame[];
  if (frameCount && frameCount > 0) {
    frames = Array.from({ length: frameCount }, (_, index) => {
      const x = Math.round((index * width) / frameCount);
      const next = Math.round(((index + 1) * width) / frameCount);
      return { x, y: contentTop, width: next - x };
    });
  } else {
    frames = [];
    let start = -1;
    for (let x = 0; x <= width; x++) {
      const ink = x < width && columnHasInk(x);
      if (ink && start < 0) start = x;
      else if (!ink && start >= 0) {
        frames.push({ x: start, y: contentTop, width: x - start });
        start = -1;
      }
    }
  }

  if (frames.length === 0) frames = [{ x: 0, y: contentTop, width }];

  return {
    sheetWidth: width,
    sheetHeight: height,
    contentHeight: contentBottom - contentTop + 1,
    frames,
  };
}

function sliceGrid(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  grid: SpriteGrid,
): SpriteLayout {
  const cellWidth = Math.floor(width / grid.columns);
  const cellHeight = Math.floor(height / grid.rows);
  if (cellWidth < 1 || cellHeight < 1) return wholeSheetLayout(width, height);

  const inkedCells: { originX: number; originY: number; bounds: InkBounds }[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let column = 0; column < grid.columns; column++) {
      const originX = column * cellWidth;
      const originY = row * cellHeight;
      const bounds = measureInk(data, width, {
        x: originX,
        y: originY,
        width: cellWidth,
        height: cellHeight,
      });
      if (bounds) inkedCells.push({ originX, originY, bounds });
    }
  }

  if (inkedCells.length === 0) return wholeSheetLayout(width, height);

  const left = Math.min(...inkedCells.map((c) => c.bounds.left - c.originX));
  const right = Math.max(...inkedCells.map((c) => c.bounds.right - c.originX));
  const top = Math.min(...inkedCells.map((c) => c.bounds.top - c.originY));
  const bottom = Math.max(...inkedCells.map((c) => c.bounds.bottom - c.originY));

  return {
    sheetWidth: width,
    sheetHeight: height,
    contentHeight: bottom - top + 1,
    frames: inkedCells.map(({ originX, originY }) => ({
      x: originX + left,
      y: originY + top,
      width: right - left + 1,
    })),
  };
}

export function sliceSpriteSheet(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  slicing: SpriteSlicing = {},
): SpriteLayout {
  if (slicing.grid) return sliceGrid(data, width, height, slicing.grid);
  return sliceStrip(data, width, height, slicing.frameCount);
}

export function useSpriteSheet(
  url: string,
  slicing: SpriteSlicing = {},
): SpriteLayout | null {
  const [layout, setLayout] = useState<SpriteLayout | null>(null);
  const { frameCount } = slicing;
  const columns = slicing.grid?.columns;
  const rows = slicing.grid?.rows;

  useEffect(() => {
    let cancelled = false;
    setLayout(null);
    const img = new Image();

    const run = () => {
      if (cancelled) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, w, h);
        const grid = columns && rows ? { columns, rows } : undefined;
        setLayout(sliceSpriteSheet(data, w, h, { frameCount, grid }));
      } catch {
        setLayout(wholeSheetLayout(w, h));
      }
    };

    img.onload = run;
    img.src = url;
    if (img.complete) run();
    return () => {
      cancelled = true;
    };
  }, [url, frameCount, columns, rows]);

  return layout;
}
