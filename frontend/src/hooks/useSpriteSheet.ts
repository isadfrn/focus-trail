import { useEffect, useState } from "react";

export interface SpriteFrame {
  x: number;
  width: number;
}

export interface SpriteLayout {
  sheetWidth: number;
  sheetHeight: number;
  contentTop: number;
  contentHeight: number;
  frames: SpriteFrame[];
}

const ALPHA_THRESHOLD = 8;

export function sliceSpriteSheet(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  frameCount?: number,
): SpriteLayout {
  const alpha = (x: number, y: number) => data[(y * width + x) * 4 + 3];

  const columnHasInk = (x: number) => {
    for (let y = 0; y < height; y++)
      if (alpha(x, y) > ALPHA_THRESHOLD) return true;
    return false;
  };

  let contentTop = 0;
  let contentBottom = height - 1;
  for (let y = 0; y < height; y++) {
    let ink = false;
    for (let x = 0; x < width; x++)
      if (alpha(x, y) > ALPHA_THRESHOLD) {
        ink = true;
        break;
      }
    if (ink) {
      contentTop = y;
      break;
    }
  }
  for (let y = height - 1; y >= contentTop; y--) {
    let ink = false;
    for (let x = 0; x < width; x++)
      if (alpha(x, y) > ALPHA_THRESHOLD) {
        ink = true;
        break;
      }
    if (ink) {
      contentBottom = y;
      break;
    }
  }
  const contentHeight = contentBottom - contentTop + 1;

  let frames: SpriteFrame[];
  if (frameCount && frameCount > 0) {
    frames = Array.from({ length: frameCount }, (_, i) => {
      const x = Math.round((i * width) / frameCount);
      const next = Math.round(((i + 1) * width) / frameCount);
      return { x, width: next - x };
    });
  } else {
    frames = [];
    let start = -1;
    for (let x = 0; x <= width; x++) {
      const ink = x < width && columnHasInk(x);
      if (ink && start < 0) start = x;
      else if (!ink && start >= 0) {
        frames.push({ x: start, width: x - start });
        start = -1;
      }
    }
  }

  if (frames.length === 0) frames = [{ x: 0, width }];

  return { sheetWidth: width, sheetHeight: height, contentTop, contentHeight, frames };
}

export function useSpriteSheet(
  url: string,
  frameCount?: number,
): SpriteLayout | null {
  const [layout, setLayout] = useState<SpriteLayout | null>(null);

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
        if (!ctx) throw new Error("sem contexto 2d");
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, w, h);
        setLayout(sliceSpriteSheet(data, w, h, frameCount));
      } catch {
        setLayout({
          sheetWidth: w,
          sheetHeight: h,
          contentTop: 0,
          contentHeight: h,
          frames: [{ x: 0, width: w }],
        });
      }
    };

    img.onload = run;
    img.src = url;
    if (img.complete) run();
    return () => {
      cancelled = true;
    };
  }, [url, frameCount]);

  return layout;
}
