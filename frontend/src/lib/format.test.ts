import { afterEach, describe, expect, it } from "vitest";

import i18n from "../i18n";
import {
  formatClock,
  formatDateTime,
  formatDuration,
  formatRatio,
  formatShortDay,
} from "./format";

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

describe("localized dates", () => {
  afterEach(async () => {
    await i18n.changeLanguage("pt");
  });

  it("orders a short day by the active language", async () => {
    expect(formatShortDay("2026-09-02")).toBe("02/09");

    await i18n.changeLanguage("en");
    expect(formatShortDay("2026-09-02")).toBe("09/02");
  });

  it("formats date and time with the active language", async () => {
    const iso = "2026-09-13T14:30:00.000Z";
    const portuguese = formatDateTime(iso);

    await i18n.changeLanguage("en");
    expect(formatDateTime(iso)).not.toBe(portuguese);
  });

  it("formats the focus to break ratio with the decimal separator of the language", async () => {
    expect(formatRatio(1.5)).toBe("1,5:1");

    await i18n.changeLanguage("en");
    expect(formatRatio(1.5)).toBe("1.5:1");
  });
});
