import { describe, expect, it } from "vitest";

import type { ShareCardContent } from "./share-card";
import {
  centerPanelY,
  fitLayout,
  measurePanelHeight,
  MIN_FIT_FACTOR,
  planBlocks,
  resolveBand,
  scaleLayout,
  SHARE_LAYOUTS,
  titleLineHeight,
} from "./share-layout";

const dayContent: ShareCardContent = {
  kind: "day",
  kicker: "FOCO DE HOJE",
  subtitle: "sexta-feira, 25 de setembro",
  seconds: 9300,
  goal: { ratio: 0.86, leftLabel: "Meta", rightLabel: "86%" },
  stats: [
    { value: "6", label: "pomodoros" },
    { value: "5", label: "dias seguidos" },
    { value: "100%", label: "concluídos" },
  ],
};

const taskContent: ShareCardContent = {
  kind: "task",
  kicker: "TAREFA",
  title: "Estudar inglês",
  heroCaption: "de foco no total",
  seconds: 45600,
  stats: [{ value: "34", label: "pomodoros" }],
};

describe("planBlocks", () => {
  it("plans a standalone-logo day card with kicker, subtitle, goal and stats", () => {
    const ids = planBlocks(dayContent, SHARE_LAYOUTS.story, 0).map((b) => b.id);
    expect(ids).toEqual([
      "kicker",
      "subtitle",
      "hero",
      "goal",
      "divider",
      "stats",
    ]);
  });

  it("uses a header row instead of a kicker in the square layout", () => {
    const ids = planBlocks(taskContent, SHARE_LAYOUTS.square, 2).map((b) => b.id);
    expect(ids).toEqual(["header", "title", "hero", "caption", "divider", "stats"]);
  });

  it("skips the title and the stats section when there is nothing to show", () => {
    const ids = planBlocks(
      { ...taskContent, title: undefined, stats: [] },
      SHARE_LAYOUTS.story,
      0,
    ).map((b) => b.id);
    expect(ids).toEqual(["kicker", "hero", "caption"]);
  });

  it("grows the title block with each line", () => {
    const layout = SHARE_LAYOUTS.story;
    const height = (lines: number) =>
      planBlocks(taskContent, layout, lines).find((b) => b.id === "title")!
        .height;
    expect(height(2) - height(1)).toBe(titleLineHeight(layout));
  });
});

describe("scaleLayout", () => {
  it("scales sizes and gaps but keeps the panel width", () => {
    const base = SHARE_LAYOUTS.story;
    const scaled = scaleLayout(base, 0.5);
    expect(scaled.hero).toBe(Math.round(base.hero * 0.5));
    expect(scaled.gaps.heroToNext).toBe(Math.round(base.gaps.heroToNext * 0.5));
    expect(scaled.panelWidth).toBe(base.panelWidth);
  });
});

describe("fitLayout", () => {
  const countLines = () => 1;

  it("keeps full scale when the panel already fits", () => {
    const fitted = fitLayout(SHARE_LAYOUTS.story, dayContent, 10_000, countLines);
    expect(fitted.factor).toBe(1);
    expect(fitted.panelHeight).toBe(
      measurePanelHeight(fitted.blocks, fitted.layout),
    );
  });

  it("shrinks until the panel fits the available height", () => {
    const full = fitLayout(SHARE_LAYOUTS.story, dayContent, 10_000, countLines);
    const fitted = fitLayout(
      SHARE_LAYOUTS.story,
      dayContent,
      full.panelHeight - 100,
      countLines,
    );
    expect(fitted.factor).toBeLessThan(1);
    expect(fitted.panelHeight).toBeLessThanOrEqual(full.panelHeight - 100);
  });

  it("never shrinks below the minimum factor", () => {
    const fitted = fitLayout(SHARE_LAYOUTS.story, dayContent, 10, countLines);
    expect(fitted.factor).toBeCloseTo(MIN_FIT_FACTOR, 2);
  });
});

describe("resolveBand and centerPanelY", () => {
  it("starts below the standalone logo and stops above the character and pill", () => {
    const layout = SHARE_LAYOUTS.story;
    const band = resolveBand(layout, 1300, 0.335);
    expect(band.top).toBeCloseTo(layout.logoY + layout.logoWidth * 0.335 + layout.bandGapTop);
    expect(band.bottom).toBe(1300 - layout.bandGapBottom - layout.pillHeight / 2);
  });

  it("starts at the top margin when the logo lives in the header row", () => {
    const layout = SHARE_LAYOUTS.square;
    expect(resolveBand(layout, 800, 0.335).top).toBe(layout.topMargin);
  });

  it("centers the panel in the band and never above it", () => {
    expect(centerPanelY({ top: 100, bottom: 500 }, 200)).toBe(200);
    expect(centerPanelY({ top: 100, bottom: 500 }, 900)).toBe(100);
  });
});
