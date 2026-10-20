import { describe, expect, it } from "vitest";

import { MAX_MINUTES_BY_TYPE, parseMinutes } from "./duration";

describe("parseMinutes", () => {
  it("accepts whole numbers within the limit", () => {
    expect(parseMinutes("25", 180)).toBe(25);
    expect(parseMinutes(" 1 ", 60)).toBe(1);
    expect(parseMinutes("60", 60)).toBe(60);
  });

  it("rejects blank, fractional, zero, negative and over-limit values", () => {
    expect(parseMinutes("", 60)).toBeNull();
    expect(parseMinutes("  ", 60)).toBeNull();
    expect(parseMinutes("2.5", 60)).toBeNull();
    expect(parseMinutes("0", 60)).toBeNull();
    expect(parseMinutes("-3", 60)).toBeNull();
    expect(parseMinutes("61", 60)).toBeNull();
    expect(parseMinutes("abc", 60)).toBeNull();
  });

  it("mirrors the backend limits per session type", () => {
    expect(MAX_MINUTES_BY_TYPE).toEqual({ focus: 180, break: 60 });
  });
});
