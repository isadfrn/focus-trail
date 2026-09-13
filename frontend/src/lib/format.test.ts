import { describe, expect, it } from "vitest";

import { formatClock, formatDateTime, formatDuration } from "./format";

describe("format", () => {
  it("formats a clock as mm:ss", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(1500)).toBe("25:00");
  });

  it("formats a duration with minutes and seconds", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(90)).toBe("1min 30s");
    expect(formatDuration(1500)).toBe("25min 0s");
  });

  it("formats an ISO string into a short date and time", () => {
    const formatted = formatDateTime("2026-09-13T14:30:00.000Z");
    expect(typeof formatted).toBe("string");
    expect(formatted).toMatch(/\d/);
  });
});
