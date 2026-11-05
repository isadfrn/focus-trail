import { afterEach, describe, expect, it } from "vitest";

import i18n from "../../i18n";
import {
  buildCardContent,
  buildShareText,
  formatShortDate,
  type DayShareSubject,
  type TaskShareSubject,
} from "./share-card";

const now = new Date(2026, 8, 25, 12, 0, 0);

const daySubject: DayShareSubject = {
  kind: "day",
  date: new Date(2026, 8, 25, 9, 0, 0),
  focusSeconds: 2 * 3600 + 35 * 60,
  completedFocus: 1,
  interruptedFocus: 1,
  goalMinutes: 180,
  streak: 5,
};

const taskSubject: TaskShareSubject = {
  kind: "task",
  label: "Read",
  showLabel: true,
  focusSeconds: 3600,
  completedFocus: 2,
  activeDays: 1,
  firstAt: new Date(2025, 8, 2, 10, 0, 0),
};

describe("share card content by language", () => {
  afterEach(async () => {
    await i18n.changeLanguage("pt");
  });

  it("builds the day card in English", async () => {
    await i18n.changeLanguage("en");
    const content = buildCardContent(daySubject, now);

    expect(content.kicker).toBe("TODAY'S FOCUS");
    expect(content.subtitle).toBe("Friday, September 25");
    expect(content.stats.map((stat) => stat.label)).toEqual([
      "pomodoro",
      "days in a row",
      "completed",
    ]);
    expect(content.goal?.leftLabel).toBe("Daily goal · 3h");
  });

  it("builds the day card in Spanish", async () => {
    await i18n.changeLanguage("es");
    const content = buildCardContent(daySubject, now);

    expect(content.kicker).toBe("ENFOQUE DE HOY");
    expect(content.subtitle).toBe("viernes, 25 de septiembre");
    expect(content.stats.map((stat) => stat.label)).toEqual([
      "pomodoro",
      "días seguidos",
      "completados",
    ]);
  });

  it("builds the task card in each language", async () => {
    await i18n.changeLanguage("en");
    const english = buildCardContent(taskSubject, now);
    expect(english.kicker).toBe("TASK");
    expect(english.heroCaption).toBe("of focus in total");
    expect(english.stats.map((stat) => stat.label)).toEqual([
      "pomodoros",
      "day",
      "since",
    ]);

    await i18n.changeLanguage("es");
    const spanish = buildCardContent(taskSubject, now);
    expect(spanish.kicker).toBe("TAREA");
    expect(spanish.heroCaption).toBe("de enfoque en total");
  });

  it("writes the share text in each language", async () => {
    await i18n.changeLanguage("en");
    expect(buildShareText(daySubject, now)).toBe(
      "Today I focused for 2h 35min on Focus Trail 🍅",
    );
    expect(buildShareText(taskSubject, now)).toBe(
      'I\'ve focused for 1h on the task "Read" with Focus Trail 🍅',
    );
    expect(buildShareText({ ...taskSubject, showLabel: false }, now)).toBe(
      "I've focused for 1h on a task with Focus Trail 🍅",
    );

    await i18n.changeLanguage("es");
    expect(buildShareText(daySubject, now)).toBe(
      "Hoy me concentré 2h 35min en Focus Trail 🍅",
    );
  });

  it("formats short dates with the order of the active language", async () => {
    const date = new Date(2026, 8, 2);

    await i18n.changeLanguage("pt");
    expect(formatShortDate(date, now)).toBe("02/09");

    await i18n.changeLanguage("en");
    expect(formatShortDate(date, now)).toBe("09/02");
  });
});
