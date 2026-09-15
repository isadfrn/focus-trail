import { describe, expect, it } from "vitest";

import { nextPhase, phaseMinutes, phaseType } from "./pomodoro-cycle";

const prefs = { focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15 };

describe("phaseType", () => {
  it("maps focus to a focus session and every break to a break session", () => {
    expect(phaseType("focus")).toBe("focus");
    expect(phaseType("shortBreak")).toBe("break");
    expect(phaseType("longBreak")).toBe("break");
  });
});

describe("phaseMinutes", () => {
  it("returns the minutes for each phase", () => {
    expect(phaseMinutes("focus", prefs)).toBe(25);
    expect(phaseMinutes("shortBreak", prefs)).toBe(5);
    expect(phaseMinutes("longBreak", prefs)).toBe(15);
  });
});

describe("nextPhase", () => {
  it("goes to a short break after a focus that is not the Nth", () => {
    expect(nextPhase("focus", 1, 4)).toBe("shortBreak");
    expect(nextPhase("focus", 3, 4)).toBe("shortBreak");
  });

  it("goes to a long break after every Nth focus", () => {
    expect(nextPhase("focus", 4, 4)).toBe("longBreak");
    expect(nextPhase("focus", 8, 4)).toBe("longBreak");
  });

  it("always returns to focus after a break", () => {
    expect(nextPhase("break", 2, 4)).toBe("focus");
  });

  it("never schedules a long break when the interval is zero", () => {
    expect(nextPhase("focus", 4, 0)).toBe("shortBreak");
  });
});
