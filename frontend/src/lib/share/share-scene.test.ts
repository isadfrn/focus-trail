import { describe, expect, it } from "vitest";

import { createFakeContext } from "../../test/fake-canvas";
import type { CharacterTheme } from "../../types/character";
import { drawShareScene, pickWalkFrame } from "./share-scene";

function makeImage(width: number, height: number): HTMLImageElement {
  return { naturalWidth: width, naturalHeight: height } as HTMLImageElement;
}

function makeCharacter(overrides: Partial<CharacterTheme> = {}): CharacterTheme {
  return {
    id: "x",
    name: "X",
    skyColor: "#8ec7ff",
    background: "bg",
    terrain: "terrain",
    sheet: "sheet",
    ...overrides,
  };
}

const sprite = {
  image: {} as CanvasImageSource,
  layout: {
    sheetWidth: 90,
    sheetHeight: 30,
    contentTop: 0,
    contentHeight: 30,
    frames: [
      { x: 0, width: 30 },
      { x: 30, width: 30 },
      { x: 60, width: 30 },
    ],
  },
};

const images = { background: makeImage(256, 256), terrain: makeImage(32, 32) };

describe("pickWalkFrame", () => {
  it("picks a frame about a third into the walk cycle", () => {
    const frames = Array.from({ length: 16 }, (_, index) => ({ x: index, width: 1 }));
    expect(pickWalkFrame(frames)).toBe(frames[5]);
  });

  it("falls back to the first frame for a single-frame sheet", () => {
    const frames = [{ x: 0, width: 10 }];
    expect(pickWalkFrame(frames)).toBe(frames[0]);
  });
});

describe("drawShareScene", () => {
  it("fills the sky, tiles background and terrain, and draws one sprite frame", () => {
    const fake = createFakeContext();
    drawShareScene(fake.ctx, 1080, 1080, makeCharacter(), images, sprite, 0);

    expect(fake.callsOf("fillRect")[0].state.fillStyle).toBe("#8ec7ff");
    expect(fake.callsOf("fillRect")[0].args).toEqual([0, 0, 1080, 1080]);
    expect(fake.callsOf("drawImage").length).toBeGreaterThan(3);
    expect(fake.calls[1].state.imageSmoothingEnabled).toBe(false);
  });

  it("sizes the background to the card height like the app scene", () => {
    const fake = createFakeContext();
    drawShareScene(fake.ctx, 1080, 1080, makeCharacter(), images, sprite, 0);
    const first = fake.callsOf("drawImage")[0];
    expect(first.args[0]).toBe(images.background);
    expect(first.args[4]).toBe(1080);
    expect(first.args[3]).toBeGreaterThanOrEqual(1080);
  });

  it("stands the character on the ground using the scenario baseline", () => {
    const fake = createFakeContext();
    const geometry = drawShareScene(
      fake.ctx,
      1080,
      800,
      makeCharacter({ baseline: 50 }),
      images,
      sprite,
      0,
    );
    expect(geometry.characterBottom).toBe(800 - 50);
    expect(geometry.characterTop).toBeLessThan(geometry.characterBottom);
  });

  it("raises the ground by the lift and extends it with mirrored bands", () => {
    const withoutLift = createFakeContext();
    const flat = drawShareScene(withoutLift.ctx, 1080, 800, makeCharacter(), images, sprite, 0);

    const withLift = createFakeContext();
    const lifted = drawShareScene(withLift.ctx, 1080, 800, makeCharacter(), images, sprite, 200);

    expect(lifted.characterBottom).toBe(flat.characterBottom - 200);
    expect(withLift.callsOf("scale").length).toBeGreaterThan(0);
    expect(withLift.callsOf("drawImage").length).toBeGreaterThan(
      withoutLift.callsOf("drawImage").length,
    );
  });

  it("alternates mirrored and direct bands when the lift exceeds one band", () => {
    const fake = createFakeContext();
    drawShareScene(fake.ctx, 100, 800, makeCharacter({ terrainHeight: 40 }), images, sprite, 300);
    const scales = fake.callsOf("scale").length;
    const drawCalls = fake.callsOf("drawImage").length;
    expect(scales).toBeGreaterThan(0);
    expect(drawCalls).toBeGreaterThan(scales);
  });

  it("uses an explicit sprite height from the scenario", () => {
    const small = createFakeContext();
    const big = createFakeContext();
    const smallGeometry = drawShareScene(small.ctx, 1080, 800, makeCharacter({ height: 60 }), images, sprite, 0);
    const bigGeometry = drawShareScene(big.ctx, 1080, 800, makeCharacter({ height: 240 }), images, sprite, 0);
    expect(bigGeometry.characterBottom - bigGeometry.characterTop).toBeGreaterThan(
      smallGeometry.characterBottom - smallGeometry.characterTop,
    );
  });
});
