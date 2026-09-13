import { describe, expect, it } from "vitest";

import { hexToRgb, isLightColor, relativeLuminance } from "./color";

describe("color", () => {
  it("expands shorthand hex and parses full hex", () => {
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("007474")).toEqual([0, 116, 116]);
  });

  it("computes relative luminance between 0 and 1", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("classifies light versus dark colors", () => {
    expect(isLightColor("#ffffff")).toBe(true);
    expect(isLightColor("#007474")).toBe(false);
    expect(isLightColor("#000000")).toBe(false);
  });
});
