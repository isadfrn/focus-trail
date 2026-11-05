import { afterEach, describe, expect, it, vi } from "vitest";

import type { ScenePalette } from "../../types/character";
import { createFakeContext } from "../../test/fake-canvas";
import type { ShareCardContent } from "./share-card";
import {
  blurredCopy,
  drawBlock,
  drawGlass,
  drawHero,
  drawPill,
  drawSpacedText,
  drawStatsRow,
  measureHero,
  roundRectPath,
  withAlpha,
  wrapText,
  type BlockContext,
} from "./share-draw";
import { buildHeroRuns } from "./share-card";
import { SHARE_LAYOUTS } from "./share-layout";

const palette: ScenePalette = {
  foreground: "#f8eed3",
  accent: "#e4ba4e",
  panel: "rgba(16, 30, 35, 0.55)",
  panelBorder: "rgba(255, 255, 255, 0.15)",
  onAccent: "#101e23",
};

describe("withAlpha", () => {
  it("converts hex colors to rgba", () => {
    expect(withAlpha("#ffffff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
    expect(withAlpha("#0b1518", 1)).toBe("rgba(11, 21, 24, 1)");
  });

  it("leaves non-hex colors untouched", () => {
    expect(withAlpha("rgb(1, 2, 3)", 0.5)).toBe("rgb(1, 2, 3)");
  });
});

describe("roundRectPath", () => {
  it("uses the native roundRect when available", () => {
    const { ctx, callsOf } = createFakeContext();
    roundRectPath(ctx, 0, 0, 100, 50, 10);
    expect(callsOf("roundRect")).toHaveLength(1);
  });

  it("falls back to arcs when roundRect is missing", () => {
    const { ctx, callsOf } = createFakeContext(undefined, { roundRect: undefined });
    roundRectPath(ctx, 0, 0, 100, 50, 10);
    expect(callsOf("arcTo")).toHaveLength(4);
    expect(callsOf("closePath")).toHaveLength(1);
  });
});

describe("wrapText", () => {
  const { ctx } = createFakeContext((text) => text.length * 10);

  it("keeps short text on one line", () => {
    expect(wrapText(ctx, "Estudar inglês", 500, 2)).toEqual(["Estudar inglês"]);
  });

  it("wraps on word boundaries", () => {
    expect(wrapText(ctx, "aaaa bbbb cccc", 90, 3)).toEqual(["aaaa bbbb", "cccc"]);
  });

  it("ends the last line with an ellipsis when it overflows", () => {
    const lines = wrapText(ctx, "aaaa bbbb cccc dddd eeee", 90, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });

  it("breaks a word wider than the line", () => {
    const lines = wrapText(ctx, "abcdefghijkl", 50, 5);
    expect(lines.every((line) => line.length <= 5)).toBe(true);
    expect(lines.join("")).toBe("abcdefghijkl");
  });

  it("returns no lines for blank text", () => {
    expect(wrapText(ctx, "   ", 100, 2)).toEqual([]);
  });
});

describe("drawSpacedText", () => {
  it("draws each glyph separated by the spacing", () => {
    const { ctx, callsOf } = createFakeContext(() => 10);
    drawSpacedText(ctx, "abc", 100, 50, 5, "left");
    const xs = callsOf("fillText").map((call) => call.args[1]);
    expect(xs).toEqual([100, 115, 130]);
  });

  it("centers and right-aligns using the total width", () => {
    const centered = createFakeContext(() => 10);
    drawSpacedText(centered.ctx, "ab", 100, 0, 10, "center");
    expect(centered.callsOf("fillText")[0].args[1]).toBe(100 - 15);

    const right = createFakeContext(() => 10);
    drawSpacedText(right.ctx, "ab", 100, 0, 10, "right");
    expect(right.callsOf("fillText")[0].args[1]).toBe(100 - 30);
  });
});

describe("hero", () => {
  it("measures runs with their own font sizes", () => {
    const fake = createFakeContext((text) => text.length * 10);
    const width = measureHero(fake.ctx as never, buildHeroRuns(2 * 3600 + 35 * 60), {
      number: 100,
      unit: 40,
    });
    expect(width).toBeGreaterThan(0);
  });

  it("shrinks to fit the maximum width", () => {
    const wide = createFakeContext((text) => text.length * 200);
    drawHero(wide.ctx, 128 * 3600 + 5 * 60, 500, 300, SHARE_LAYOUTS.story, palette, 800);
    const sizes = wide
      .callsOf("fillText")
      .map((call) => Number((/(\d+(\.\d+)?)px/.exec(String(call.state.font)))?.[1]));
    expect(Math.max(...sizes)).toBeLessThan(SHARE_LAYOUTS.story.hero);
  });

  it("colors numbers with the foreground and units with the accent", () => {
    const fake = createFakeContext(() => 10);
    drawHero(fake.ctx, 35 * 60, 500, 300, SHARE_LAYOUTS.story, palette, 900);
    const fills = fake.callsOf("fillText").map((call) => call.state.fillStyle);
    expect(fills).toEqual([palette.foreground, palette.accent]);
  });
});

describe("drawStatsRow", () => {
  it("draws a value and a label per stat and separators between columns", () => {
    const fake = createFakeContext(() => 10);
    drawStatsRow(fake.ctx, 0, 0, 900, SHARE_LAYOUTS.story, palette, [
      { value: "6", label: "pomodoros" },
      { value: "5", label: "dias seguidos" },
    ]);
    expect(fake.callsOf("fillText")).toHaveLength(4);
    expect(fake.callsOf("fillRect")).toHaveLength(1);
  });

  it("shrinks values that would overflow their column", () => {
    const fake = createFakeContext(() => 2000);
    drawStatsRow(fake.ctx, 0, 0, 900, SHARE_LAYOUTS.story, palette, [
      { value: "100%", label: "concluídos" },
    ]);
    const valueCall = fake.callsOf("fillText")[0];
    const size = Number((/(\d+(\.\d+)?)px/.exec(String(valueCall.state.font)))?.[1]);
    expect(size).toBeLessThan(SHARE_LAYOUTS.story.statNumber);
  });
});

describe("drawPill", () => {
  it("draws a rounded pill with the link text in the on-accent color", () => {
    const fake = createFakeContext(() => 200);
    drawPill(fake.ctx, 540, 900, "focustrail.com.br/app", SHARE_LAYOUTS.story, palette);
    const text = fake.callsOf("fillText")[0];
    expect(text.args[0]).toBe("focustrail.com.br/app");
    expect(text.state.fillStyle).toBe(palette.onAccent);
    expect(fake.callsOf("roundRect")).toHaveLength(1);
  });
});

describe("glass", () => {
  afterEach(() => vi.restoreAllMocks());

  function stubCanvasContexts() {
    const contexts: ReturnType<typeof createFakeContext>[] = [];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      const fake = createFakeContext();
      contexts.push(fake);
      return fake.ctx as never;
    });
    return contexts;
  }

  it("blurs by repeatedly halving the region down to the target size", () => {
    const contexts = stubCanvasContexts();
    const source = document.createElement("canvas");
    const result = blurredCopy(source, { x: 0, y: 0, width: 800, height: 600 }, 30);
    expect(result.width).toBeLessThanOrEqual(50);
    expect(result.width).toBeGreaterThanOrEqual(26);
    expect(contexts.length).toBeGreaterThan(2);
  });

  it("clips to a rounded rect, paints the blur and the palette panel color, then strokes the border", () => {
    stubCanvasContexts();
    const fake = createFakeContext();
    drawGlass(
      fake.ctx,
      document.createElement("canvas"),
      { x: 10, y: 20, width: 400, height: 300 },
      40,
      palette,
      30,
    );
    expect(fake.callsOf("clip")).toHaveLength(1);
    expect(fake.callsOf("drawImage")).toHaveLength(1);
    expect(fake.callsOf("fillRect")[0].state.fillStyle).toBe(palette.panel);
    expect(fake.callsOf("stroke")[0].state.strokeStyle).toBe(palette.panelBorder);
  });
});

describe("drawBlock", () => {
  const logo = { naturalWidth: 863, naturalHeight: 289 } as HTMLImageElement;

  function makeBlockContext(
    content: ShareCardContent,
    layoutId: "story" | "square",
    titleLines: string[] = [],
  ) {
    const fake = createFakeContext(() => 10);
    const block: BlockContext = {
      ctx: fake.ctx,
      content,
      layout: SHARE_LAYOUTS[layoutId],
      palette,
      panelX: 60,
      logo,
      titleLines,
    };
    return { fake, block };
  }

  const dayContent: ShareCardContent = {
    kind: "day",
    kicker: "FOCO DE HOJE",
    subtitle: "sexta-feira, 25 de setembro",
    seconds: 9300,
    goal: { ratio: 0.5, leftLabel: "Meta", rightLabel: "50%" },
    stats: [{ value: "6", label: "pomodoros" }],
  };

  it("draws the kicker glyph by glyph", () => {
    const { fake, block } = makeBlockContext(dayContent, "story");
    drawBlock("kicker", 100, block);
    expect(fake.callsOf("fillText")).toHaveLength("FOCO DE HOJE".length);
  });

  it("draws the subtitle, hero, goal, divider and stats", () => {
    const { fake, block } = makeBlockContext(dayContent, "story");
    drawBlock("subtitle", 0, block);
    expect(fake.callsOf("fillText")[0].args[0]).toBe(dayContent.subtitle);
    drawBlock("hero", 0, block);
    drawBlock("goal", 0, block);
    drawBlock("divider", 0, block);
    drawBlock("stats", 0, block);
    expect(fake.callsOf("fillRect").length).toBeGreaterThan(0);
  });

  it("draws the task title lines and caption", () => {
    const taskContent: ShareCardContent = {
      kind: "task",
      kicker: "TAREFA",
      title: "Estudar inglês",
      heroCaption: "de foco no total",
      seconds: 100,
      stats: [],
    };
    const { fake, block } = makeBlockContext(taskContent, "story", ["Estudar", "inglês"]);
    drawBlock("title", 0, block);
    drawBlock("caption", 0, block);
    const texts = fake.callsOf("fillText").map((call) => call.args[0]);
    expect(texts).toEqual(["Estudar", "inglês", "de foco no total"]);
  });

  it("draws the header row with the logo, kicker and date for a day", () => {
    const { fake, block } = makeBlockContext(dayContent, "square");
    drawBlock("header", 0, block);
    expect(fake.callsOf("drawImage")).toHaveLength(1);
    const texts = fake.callsOf("fillText").map((call) => call.args[0]);
    expect(texts).toContain(dayContent.subtitle);
  });

  it("draws only the kicker beside the logo for a task", () => {
    const { fake, block } = makeBlockContext(
      { kind: "task", kicker: "TAREFA", seconds: 60, stats: [] },
      "square",
    );
    drawBlock("header", 0, block);
    const texts = fake.callsOf("fillText").map((call) => call.args[0]);
    expect(texts.join("")).toBe("TAREFA");
  });

  it("ignores the goal block when the content has no goal", () => {
    const { fake, block } = makeBlockContext({ ...dayContent, goal: undefined }, "story");
    drawBlock("goal", 0, block);
    expect(fake.calls).toHaveLength(0);
  });
});
