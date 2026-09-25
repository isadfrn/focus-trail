import { describe, expect, it } from "vitest";

import {
  buildCardContent,
  buildHeroRuns,
  buildShareCaption,
  formatShareDuration,
  formatShortDate,
  SHARE_FORMATS,
  type DayShareSubject,
  type TaskShareSubject,
} from "./share-card";

const now = new Date(2026, 8, 25, 12, 0, 0);

function daySubject(overrides: Partial<DayShareSubject> = {}): DayShareSubject {
  return {
    kind: "day",
    date: new Date(2026, 8, 25, 9, 0, 0),
    focusSeconds: 2 * 3600 + 35 * 60,
    completedFocus: 6,
    interruptedFocus: 0,
    goalMinutes: 180,
    streak: 5,
    ...overrides,
  };
}

function taskSubject(overrides: Partial<TaskShareSubject> = {}): TaskShareSubject {
  return {
    kind: "task",
    label: "Estudar inglês",
    showLabel: true,
    focusSeconds: 12 * 3600 + 40 * 60,
    completedFocus: 34,
    activeDays: 9,
    firstAt: new Date(2026, 8, 2, 10, 0, 0),
    ...overrides,
  };
}

describe("formats", () => {
  it("exposes the story and square export sizes", () => {
    expect(SHARE_FORMATS.story).toMatchObject({ width: 1080, height: 1920 });
    expect(SHARE_FORMATS.square).toMatchObject({ width: 1080, height: 1080 });
  });
});

describe("buildHeroRuns", () => {
  it("splits hours and minutes with units", () => {
    expect(buildHeroRuns(2 * 3600 + 35 * 60)).toEqual([
      { text: "2", unit: false },
      { text: "h", unit: true },
      { text: "35", unit: false },
      { text: "min", unit: true },
    ]);
  });

  it("pads minutes when hours are present", () => {
    expect(buildHeroRuns(3600 + 5 * 60).map((run) => run.text)).toEqual([
      "1",
      "h",
      "05",
      "min",
    ]);
  });

  it("drops the minutes on a whole hour", () => {
    expect(buildHeroRuns(2 * 3600).map((run) => run.text)).toEqual(["2", "h"]);
  });

  it("shows only minutes under an hour", () => {
    expect(buildHeroRuns(45 * 60).map((run) => run.text)).toEqual(["45", "min"]);
  });

  it("clamps negative input to zero minutes", () => {
    expect(buildHeroRuns(-10).map((run) => run.text)).toEqual(["0", "min"]);
  });
});

describe("formatShareDuration", () => {
  it("joins runs into a readable duration", () => {
    expect(formatShareDuration(2 * 3600 + 35 * 60)).toBe("2h 35min");
    expect(formatShareDuration(2 * 3600)).toBe("2h");
    expect(formatShareDuration(45 * 60)).toBe("45min");
  });
});

describe("formatShortDate", () => {
  it("omits the year within the current year", () => {
    expect(formatShortDate(new Date(2026, 8, 2), now)).toBe("02/09");
  });

  it("includes a short year for other years", () => {
    expect(formatShortDate(new Date(2025, 11, 31), now)).toBe("31/12/25");
  });
});

describe("buildCardContent for a day", () => {
  it("builds the full card with goal, streak and completion", () => {
    const content = buildCardContent(daySubject(), now);
    expect(content.kind).toBe("day");
    expect(content.kicker).toBe("FOCO DE HOJE");
    expect(content.subtitle).toContain("25 de setembro");
    expect(content.seconds).toBe(9300);
    expect(content.goal).toEqual({
      ratio: 155 / 180,
      leftLabel: "Meta diária · 3h",
      rightLabel: "86%",
    });
    expect(content.stats).toEqual([
      { value: "6", label: "pomodoros" },
      { value: "5", label: "dias seguidos" },
      { value: "100%", label: "concluídos" },
    ]);
  });

  it("hides goal and streak when no goal is configured", () => {
    const content = buildCardContent(daySubject({ goalMinutes: 0 }), now);
    expect(content.goal).toBeUndefined();
    expect(content.stats.map((stat) => stat.label)).toEqual([
      "pomodoros",
      "concluídos",
    ]);
  });

  it("marks the goal as reached and caps the ratio", () => {
    const content = buildCardContent(
      daySubject({ focusSeconds: 4 * 3600, goalMinutes: 120 }),
      now,
    );
    expect(content.goal?.ratio).toBe(1);
    expect(content.goal?.rightLabel).toBe("Meta batida");
  });

  it("uses singular labels and the completion rate with interruptions", () => {
    const content = buildCardContent(
      daySubject({ completedFocus: 1, interruptedFocus: 3, streak: 1 }),
      now,
    );
    expect(content.stats).toEqual([
      { value: "1", label: "pomodoro" },
      { value: "1", label: "dia seguido" },
      { value: "25%", label: "concluídos" },
    ]);
  });

  it("labels a past day differently and omits empty stats", () => {
    const content = buildCardContent(
      daySubject({
        date: new Date(2026, 8, 20),
        completedFocus: 0,
        interruptedFocus: 0,
        streak: 0,
      }),
      now,
    );
    expect(content.kicker).toBe("FOCO DO DIA");
    expect(content.stats).toEqual([]);
  });
});

describe("buildCardContent for a task", () => {
  it("builds the task card", () => {
    const content = buildCardContent(taskSubject(), now);
    expect(content).toMatchObject({
      kind: "task",
      kicker: "TAREFA",
      title: "Estudar inglês",
      heroCaption: "de foco no total",
      seconds: 45600,
    });
    expect(content.stats).toEqual([
      { value: "34", label: "pomodoros" },
      { value: "9", label: "dias" },
      { value: "02/09", label: "desde" },
    ]);
  });

  it("hides the task name when requested", () => {
    expect(
      buildCardContent(taskSubject({ showLabel: false }), now).title,
    ).toBeUndefined();
  });

  it("omits zero counters but always keeps the start date", () => {
    const content = buildCardContent(
      taskSubject({ completedFocus: 0, activeDays: 0 }),
      now,
    );
    expect(content.stats).toEqual([{ value: "02/09", label: "desde" }]);
  });
});

describe("buildShareCaption", () => {
  const url = "https://isabellanunes.dev/focus/";

  it("writes a caption for today", () => {
    expect(buildShareCaption(daySubject(), url, now)).toBe(
      `Hoje eu foquei 2h 35min no Focus Trail 🍅\n${url}`,
    );
  });

  it("mentions the date for a past day", () => {
    const caption = buildShareCaption(
      daySubject({ date: new Date(2026, 8, 20) }),
      url,
      now,
    );
    expect(caption).toContain("Em domingo, 20 de setembro eu foquei");
  });

  it("names the task when visible and hides it otherwise", () => {
    expect(buildShareCaption(taskSubject(), url, now)).toContain(
      'na tarefa "Estudar inglês"',
    );
    expect(
      buildShareCaption(taskSubject({ showLabel: false }), url, now),
    ).toContain("em uma tarefa");
  });
});

describe("buildShareText", () => {
  it("returns the caption without the link", async () => {
    const { buildShareText } = await import("./share-card");
    expect(buildShareText(daySubject(), now)).toBe(
      "Hoje eu foquei 2h 35min no Focus Trail 🍅",
    );
  });
});
