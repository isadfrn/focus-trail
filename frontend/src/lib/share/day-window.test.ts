import { describe, expect, it } from "vitest";

import { localDayRange } from "./day-window";

describe("localDayRange", () => {
  it("spans from local midnight to the next local midnight", () => {
    const { from, to } = localDayRange(new Date(2026, 8, 25, 21, 30, 0));
    expect(from).toEqual(new Date(2026, 8, 25, 0, 0, 0));
    expect(to).toEqual(new Date(2026, 8, 26, 0, 0, 0));
  });

  it("rolls over the end of the month and year", () => {
    const { to } = localDayRange(new Date(2026, 11, 31, 10, 0, 0));
    expect(to).toEqual(new Date(2027, 0, 1, 0, 0, 0));
  });
});
