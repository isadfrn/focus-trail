import type { ShareCardContent, ShareFormatId } from "./share-card";

export interface ShareLayoutGaps {
  kickerToSubtitle: number;
  kickerToTitle: number;
  subtitleToHero: number;
  titleToHero: number;
  heroToCaption: number;
  heroToNext: number;
  captionToNext: number;
  goalToDivider: number;
  dividerToStats: number;
  headerToNext: number;
}

export interface ShareLayout {
  sceneLift: number;
  headerRow: boolean;
  topMargin: number;
  panelWidth: number;
  pad: number;
  radius: number;
  blurDivisor: number;
  kicker: number;
  subtitle: number;
  title: number;
  hero: number;
  heroUnit: number;
  caption: number;
  statNumber: number;
  statLabel: number;
  goalBar: number;
  goalText: number;
  pillHeight: number;
  pillText: number;
  logoWidth: number;
  logoY: number;
  logoHeight: number;
  bandGapTop: number;
  bandGapBottom: number;
  padBottomExtra: number;
  gaps: ShareLayoutGaps;
}

export type BlockId =
  | "header"
  | "kicker"
  | "subtitle"
  | "title"
  | "hero"
  | "caption"
  | "goal"
  | "divider"
  | "stats";

export interface BlockPlan {
  id: BlockId;
  height: number;
  gapAfter: number;
}

export interface FittedLayout {
  layout: ShareLayout;
  blocks: BlockPlan[];
  panelHeight: number;
  factor: number;
}

export const MIN_FIT_FACTOR = 0.6;
const FIT_STEP = 0.02;
const HERO_CAP_RATIO = 0.74;
const TITLE_LINE_RATIO = 1.14;
const STAT_LABEL_OFFSET = 14;
const GOAL_LABEL_OFFSET = 16;
const DIVIDER_HEIGHT = 2;

export const SHARE_LAYOUTS: Record<ShareFormatId, ShareLayout> = {
  story: {
    sceneLift: 200,
    headerRow: false,
    topMargin: 0,
    panelWidth: 936,
    pad: 64,
    radius: 64,
    blurDivisor: 30,
    kicker: 38,
    subtitle: 36,
    title: 76,
    hero: 224,
    heroUnit: 90,
    caption: 36,
    statNumber: 76,
    statLabel: 30,
    goalBar: 22,
    goalText: 30,
    pillHeight: 96,
    pillText: 40,
    logoWidth: 380,
    logoY: 272,
    logoHeight: 0,
    bandGapTop: 60,
    bandGapBottom: 56,
    padBottomExtra: 44,
    gaps: {
      kickerToSubtitle: 18,
      kickerToTitle: 26,
      subtitleToHero: 40,
      titleToHero: 34,
      heroToCaption: 24,
      heroToNext: 40,
      captionToNext: 40,
      goalToDivider: 38,
      dividerToStats: 38,
      headerToNext: 30,
    },
  },
  square: {
    sceneLift: 0,
    headerRow: true,
    topMargin: 52,
    panelWidth: 960,
    pad: 48,
    radius: 56,
    blurDivisor: 30,
    kicker: 28,
    subtitle: 28,
    title: 58,
    hero: 178,
    heroUnit: 72,
    caption: 30,
    statNumber: 60,
    statLabel: 26,
    goalBar: 18,
    goalText: 26,
    pillHeight: 76,
    pillText: 32,
    logoWidth: 0,
    logoY: 0,
    logoHeight: 76,
    bandGapTop: 0,
    bandGapBottom: 34,
    padBottomExtra: 36,
    gaps: {
      kickerToSubtitle: 10,
      kickerToTitle: 20,
      subtitleToHero: 26,
      titleToHero: 22,
      heroToCaption: 18,
      heroToNext: 30,
      captionToNext: 28,
      goalToDivider: 28,
      dividerToStats: 28,
      headerToNext: 26,
    },
  },
};

const SCALED_FIELDS = [
  "pad",
  "radius",
  "kicker",
  "subtitle",
  "title",
  "hero",
  "heroUnit",
  "caption",
  "statNumber",
  "statLabel",
  "goalBar",
  "goalText",
  "pillHeight",
  "pillText",
  "logoHeight",
  "padBottomExtra",
] as const;

export function scaleLayout(base: ShareLayout, factor: number): ShareLayout {
  const scaled: ShareLayout = { ...base, gaps: { ...base.gaps } };
  for (const field of SCALED_FIELDS) {
    scaled[field] = Math.round(base[field] * factor);
  }
  for (const key of Object.keys(base.gaps) as (keyof ShareLayoutGaps)[]) {
    scaled.gaps[key] = Math.round(base.gaps[key] * factor);
  }
  return scaled;
}

export function titleLineHeight(layout: ShareLayout): number {
  return Math.round(layout.title * TITLE_LINE_RATIO);
}

export function heroCapHeight(layout: ShareLayout): number {
  return Math.round(layout.hero * HERO_CAP_RATIO);
}

export function statNumberCapHeight(layout: ShareLayout): number {
  return Math.round(layout.statNumber * HERO_CAP_RATIO);
}

export function statLabelOffset(): number {
  return STAT_LABEL_OFFSET;
}

export function goalLabelOffset(): number {
  return GOAL_LABEL_OFFSET;
}

export function planBlocks(
  content: ShareCardContent,
  layout: ShareLayout,
  titleLineCount: number,
): BlockPlan[] {
  const { gaps } = layout;
  const isTask = content.kind === "task";
  const blocks: BlockPlan[] = [];

  if (layout.headerRow) {
    blocks.push({
      id: "header",
      height: layout.logoHeight,
      gapAfter: gaps.headerToNext,
    });
  } else {
    blocks.push({
      id: "kicker",
      height: layout.kicker,
      gapAfter: isTask ? gaps.kickerToTitle : gaps.kickerToSubtitle,
    });
    if (!isTask) {
      blocks.push({
        id: "subtitle",
        height: layout.subtitle,
        gapAfter: gaps.subtitleToHero,
      });
    }
  }

  if (isTask && titleLineCount > 0) {
    const lineHeight = titleLineHeight(layout);
    blocks.push({
      id: "title",
      height: titleLineCount * lineHeight - (lineHeight - layout.title),
      gapAfter: gaps.titleToHero,
    });
  }

  blocks.push({
    id: "hero",
    height: heroCapHeight(layout),
    gapAfter: content.heroCaption ? gaps.heroToCaption : gaps.heroToNext,
  });

  if (content.heroCaption) {
    blocks.push({
      id: "caption",
      height: layout.caption,
      gapAfter: gaps.captionToNext,
    });
  }

  if (content.goal) {
    blocks.push({
      id: "goal",
      height: layout.goalBar + GOAL_LABEL_OFFSET + layout.goalText,
      gapAfter: gaps.goalToDivider,
    });
  }

  if (content.stats.length > 0) {
    blocks.push({
      id: "divider",
      height: DIVIDER_HEIGHT,
      gapAfter: gaps.dividerToStats,
    });
    blocks.push({
      id: "stats",
      height:
        statNumberCapHeight(layout) + STAT_LABEL_OFFSET + layout.statLabel,
      gapAfter: 0,
    });
  }

  return blocks;
}

export function measurePanelHeight(
  blocks: BlockPlan[],
  layout: ShareLayout,
): number {
  const contentHeight = blocks.reduce(
    (sum, block, index) =>
      sum + block.height + (index < blocks.length - 1 ? block.gapAfter : 0),
    0,
  );
  return (
    layout.pad + contentHeight + layout.pillHeight / 2 + layout.padBottomExtra
  );
}

export function fitLayout(
  base: ShareLayout,
  content: ShareCardContent,
  availableHeight: number,
  countTitleLines: (layout: ShareLayout) => number,
): FittedLayout {
  let factor = 1;
  let layout = base;
  let blocks = planBlocks(content, layout, countTitleLines(layout));
  let panelHeight = measurePanelHeight(blocks, layout);

  while (panelHeight > availableHeight && factor > MIN_FIT_FACTOR) {
    factor = Math.round((factor - FIT_STEP) * 100) / 100;
    layout = scaleLayout(base, factor);
    blocks = planBlocks(content, layout, countTitleLines(layout));
    panelHeight = measurePanelHeight(blocks, layout);
  }

  return { layout, blocks, panelHeight, factor };
}

export interface PanelBand {
  top: number;
  bottom: number;
}

export function resolveBand(
  layout: ShareLayout,
  characterTop: number,
  logoAspectRatio: number,
): PanelBand {
  const top = layout.headerRow
    ? layout.topMargin
    : layout.logoY + layout.logoWidth * logoAspectRatio + layout.bandGapTop;
  const bottom =
    characterTop - layout.bandGapBottom - Math.round(layout.pillHeight / 2);
  return { top, bottom };
}

export function centerPanelY(band: PanelBand, panelHeight: number): number {
  return Math.round(
    band.top + Math.max(0, band.bottom - band.top - panelHeight) / 2,
  );
}
