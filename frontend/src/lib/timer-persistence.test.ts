import { afterEach, describe, expect, it } from "vitest";

import {
  clearActiveSession,
  loadActiveSession,
  remainingSeconds,
  saveActiveSession,
  type ActiveSession,
} from "./timer-persistence";

const sample: ActiveSession = {
  phase: "focus",
  durationSec: 1500,
  startedAt: 1_000_000,
  endTarget: 2_500_000,
  completedFocus: 2,
  taskLabel: "Estudar",
};

afterEach(() => {
  localStorage.clear();
});

describe("active session persistence", () => {
  it("returns null when nothing is stored", () => {
    expect(loadActiveSession()).toBeNull();
  });

  it("round-trips a saved session", () => {
    saveActiveSession(sample);
    expect(loadActiveSession()).toEqual(sample);
  });

  it("clears the stored session", () => {
    saveActiveSession(sample);
    clearActiveSession();
    expect(loadActiveSession()).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    localStorage.setItem("ft_timer_active", "{not-json");
    expect(loadActiveSession()).toBeNull();
  });

  it("returns null for a payload with the wrong shape", () => {
    localStorage.setItem(
      "ft_timer_active",
      JSON.stringify({ phase: "focus", durationSec: "x" }),
    );
    expect(loadActiveSession()).toBeNull();
  });
});

describe("remainingSeconds", () => {
  it("computes the seconds left", () => {
    expect(remainingSeconds(2_000_000, 1_500_000)).toBe(500);
  });

  it("never goes below zero", () => {
    expect(remainingSeconds(1_000_000, 1_500_000)).toBe(0);
  });
});
