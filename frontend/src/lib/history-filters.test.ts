import { describe, expect, it } from "vitest";

import { buildSessionFilters, dayRange, emptyFilterForm } from "./history-filters";

describe("dayRange", () => {
  it("spans the given local day", () => {
    const { from, to } = dayRange("2026-09-12");
    const start = new Date(from);
    const end = new Date(to);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getDate()).toBe(12);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
    expect(end.getDate()).toBe(13);
  });
});

describe("buildSessionFilters", () => {
  it("returns an empty object for the empty form", () => {
    expect(buildSessionFilters(emptyFilterForm)).toEqual({});
  });

  it("combines every filter", () => {
    const filters = buildSessionFilters({
      date: "2026-09-12",
      type: "focus",
      status: "completed",
      durationOp: "gt",
      durationMinutes: "25",
    });
    expect(filters.type).toBe("focus");
    expect(filters.completed).toBe(true);
    expect(filters.durationOp).toBe("gt");
    expect(filters.durationSeconds).toBe(1500);
    expect(filters.from).toBeDefined();
    expect(filters.to).toBeDefined();
  });

  it("maps 'interrupted' status to completed=false", () => {
    expect(
      buildSessionFilters({ ...emptyFilterForm, status: "interrupted" })
        .completed,
    ).toBe(false);
  });

  it("ignores a duration value without an operator", () => {
    expect(
      buildSessionFilters({ ...emptyFilterForm, durationMinutes: "10" })
        .durationSeconds,
    ).toBeUndefined();
  });

  it("ignores an operator without a value", () => {
    expect(
      buildSessionFilters({ ...emptyFilterForm, durationOp: "lt" })
        .durationSeconds,
    ).toBeUndefined();
  });
});
