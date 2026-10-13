import { describe, expect, it } from "vitest";

import { sliceSpriteSheet, wholeSheetLayout } from "./useSpriteSheet";

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
}

function makeSheet(width: number, height: number, blocks: Block[]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const block of blocks) {
    for (let y = block.y; y < block.y + block.height; y++) {
      for (let x = block.x; x < block.x + block.width; x++) {
        data[(y * width + x) * 4 + 3] = 255;
      }
    }
  }
  return data;
}

describe("sliceSpriteSheet", () => {
  describe("horizontal strip", () => {
    it("detects frames from empty columns and trims the vertical padding", () => {
      const data = makeSheet(30, 20, [
        { x: 2, y: 5, width: 6, height: 10 },
        { x: 12, y: 6, width: 4, height: 8 },
        { x: 22, y: 5, width: 5, height: 9 },
      ]);

      const layout = sliceSpriteSheet(data, 30, 20);

      expect(layout.frames).toEqual([
        { x: 2, y: 5, width: 6 },
        { x: 12, y: 5, width: 4 },
        { x: 22, y: 5, width: 5 },
      ]);
      expect(layout.contentHeight).toBe(10);
    });

    it("splits the sheet evenly when a frame count is given", () => {
      const data = makeSheet(40, 10, [{ x: 0, y: 2, width: 40, height: 6 }]);

      const layout = sliceSpriteSheet(data, 40, 10, { frameCount: 4 });

      expect(layout.frames).toEqual([
        { x: 0, y: 2, width: 10 },
        { x: 10, y: 2, width: 10 },
        { x: 20, y: 2, width: 10 },
        { x: 30, y: 2, width: 10 },
      ]);
      expect(layout.contentHeight).toBe(6);
    });

    it("keeps the whole sheet as one frame when there is no ink", () => {
      const layout = sliceSpriteSheet(makeSheet(12, 8, []), 12, 8);

      expect(layout).toEqual({
        sheetWidth: 12,
        sheetHeight: 8,
        contentHeight: 8,
        frames: [{ x: 0, y: 0, width: 12 }],
      });
    });
  });

  describe("grid", () => {
    const columns = 3;
    const rows = 2;
    const cell = 20;

    it("slices cells in reading order sharing the union of the ink bounds", () => {
      const data = makeSheet(columns * cell, rows * cell, [
        { x: 4, y: 3, width: 6, height: 12 },
        { x: cell + 6, y: 5, width: 7, height: 10 },
        { x: 2 * cell + 5, y: 2, width: 5, height: 14 },
        { x: 3, y: cell + 4, width: 6, height: 11 },
        { x: cell + 5, y: cell + 3, width: 8, height: 12 },
        { x: 2 * cell + 4, y: cell + 6, width: 5, height: 9 },
      ]);

      const layout = sliceSpriteSheet(data, columns * cell, rows * cell, {
        grid: { columns, rows },
      });

      expect(layout.sheetWidth).toBe(60);
      expect(layout.sheetHeight).toBe(40);
      expect(layout.contentHeight).toBe(14);
      expect(layout.frames).toEqual([
        { x: 3, y: 2, width: 10 },
        { x: 23, y: 2, width: 10 },
        { x: 43, y: 2, width: 10 },
        { x: 3, y: 22, width: 10 },
        { x: 23, y: 22, width: 10 },
        { x: 43, y: 22, width: 10 },
      ]);
    });

    it("keeps every frame inside its own cell", () => {
      const data = makeSheet(columns * cell, rows * cell, [
        { x: 1, y: 1, width: 18, height: 18 },
        { x: 2 * cell + 1, y: cell + 1, width: 18, height: 18 },
      ]);

      const { frames } = sliceSpriteSheet(data, columns * cell, rows * cell, {
        grid: { columns, rows },
      });

      expect(frames).toHaveLength(2);
      expect(frames[0]).toEqual({ x: 1, y: 1, width: 18 });
      expect(frames[1]).toEqual({ x: 2 * cell + 1, y: cell + 1, width: 18 });
    });

    it("skips cells without ink", () => {
      const data = makeSheet(columns * cell, rows * cell, [
        { x: 4, y: 4, width: 8, height: 12 },
        { x: cell + 4, y: 4, width: 8, height: 12 },
      ]);

      const { frames } = sliceSpriteSheet(data, columns * cell, rows * cell, {
        grid: { columns, rows },
      });

      expect(frames).toEqual([
        { x: 4, y: 4, width: 8 },
        { x: cell + 4, y: 4, width: 8 },
      ]);
    });

    it("falls back to the whole sheet when the grid has no ink", () => {
      const layout = sliceSpriteSheet(makeSheet(60, 40, []), 60, 40, {
        grid: { columns, rows },
      });

      expect(layout).toEqual(wholeSheetLayout(60, 40));
    });

    it("falls back to the whole sheet when the grid is finer than the sheet", () => {
      const layout = sliceSpriteSheet(makeSheet(4, 4, [{ x: 0, y: 0, width: 4, height: 4 }]), 4, 4, {
        grid: { columns: 8, rows: 1 },
      });

      expect(layout).toEqual(wholeSheetLayout(4, 4));
    });

    it("prefers the grid over a frame count", () => {
      const data = makeSheet(columns * cell, rows * cell, [
        { x: 4, y: 4, width: 8, height: 12 },
      ]);

      const { frames } = sliceSpriteSheet(data, columns * cell, rows * cell, {
        frameCount: 4,
        grid: { columns, rows },
      });

      expect(frames).toEqual([{ x: 4, y: 4, width: 8 }]);
    });
  });
});
