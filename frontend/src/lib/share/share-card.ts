import i18next, { currentLanguageTag } from "../../i18n";

export type ShareFormatId = "story" | "square";

export interface ShareFormat {
  id: ShareFormatId;
  label: string;
  width: number;
  height: number;
}

export const SHARE_FORMATS: Record<ShareFormatId, ShareFormat> = {
  story: { id: "story", label: "Story 9:16", width: 1080, height: 1920 },
  square: { id: "square", label: "Post 1:1", width: 1080, height: 1080 },
};

export interface ShareStat {
  value: string;
  label: string;
}

export interface ShareGoal {
  ratio: number;
  leftLabel: string;
  rightLabel: string;
}

export interface ShareCardContent {
  kind: "day" | "task";
  kicker: string;
  subtitle?: string;
  title?: string;
  heroCaption?: string;
  seconds: number;
  goal?: ShareGoal;
  stats: ShareStat[];
}

export interface DayShareSubject {
  kind: "day";
  date: Date;
  focusSeconds: number;
  completedFocus: number;
  interruptedFocus: number;
  goalMinutes: number;
  streak: number;
}

export interface TaskShareSubject {
  kind: "task";
  label: string;
  showLabel: boolean;
  focusSeconds: number;
  completedFocus: number;
  activeDays: number;
  firstAt: Date;
}

export type ShareSubject = DayShareSubject | TaskShareSubject;

export interface HeroRun {
  text: string;
  unit: boolean;
}

const MAX_STATS = 3;

export function buildHeroRuns(seconds: number): HeroRun[] {
  const totalMinutes = Math.max(0, Math.floor(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const runs: HeroRun[] = [];
  if (hours > 0) {
    runs.push({ text: String(hours), unit: false }, { text: "h", unit: true });
  }
  if (hours === 0 || minutes > 0) {
    runs.push(
      {
        text: hours > 0 ? String(minutes).padStart(2, "0") : String(minutes),
        unit: false,
      },
      { text: "min", unit: true },
    );
  }
  return runs;
}

export function formatShareDuration(seconds: number): string {
  return buildHeroRuns(seconds)
    .reduce<string[]>((parts, run) => {
      if (run.unit) parts[parts.length - 1] += run.text;
      else parts.push(run.text);
      return parts;
    }, [])
    .join(" ");
}

function isSameLocalDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(currentLanguageTag(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatShortDate(date: Date, now: Date): string {
  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(currentLanguageTag(), {
    day: "2-digit",
    month: "2-digit",
    ...(sameYear ? {} : { year: "2-digit" }),
  }).format(date);
}

function formatGoalDuration(minutes: number): string {
  return formatShareDuration(minutes * 60);
}

function buildDayContent(subject: DayShareSubject, now: Date): ShareCardContent {
  const stats: ShareStat[] = [];

  if (subject.completedFocus > 0) {
    stats.push({
      value: String(subject.completedFocus),
      label: i18next.t("share.card.pomodoros", {
        count: subject.completedFocus,
      }),
    });
  }
  if (subject.goalMinutes > 0 && subject.streak > 0) {
    stats.push({
      value: String(subject.streak),
      label: i18next.t("share.card.streak", { count: subject.streak }),
    });
  }
  const finished = subject.completedFocus + subject.interruptedFocus;
  if (finished > 0) {
    stats.push({
      value: `${Math.round((subject.completedFocus / finished) * 100)}%`,
      label: i18next.t("share.card.completed"),
    });
  }

  const goalSeconds = subject.goalMinutes * 60;
  const goal: ShareGoal | undefined =
    goalSeconds > 0
      ? {
          ratio: Math.min(1, subject.focusSeconds / goalSeconds),
          leftLabel: i18next.t("share.card.dailyGoal", {
            duration: formatGoalDuration(subject.goalMinutes),
          }),
          rightLabel:
            subject.focusSeconds >= goalSeconds
              ? i18next.t("share.card.goalReached")
              : `${Math.floor((subject.focusSeconds / goalSeconds) * 100)}%`,
        }
      : undefined;

  return {
    kind: "day",
    kicker: i18next.t(
      isSameLocalDay(subject.date, now)
        ? "share.card.kicker.today"
        : "share.card.kicker.day",
    ),
    subtitle: formatLongDate(subject.date),
    seconds: subject.focusSeconds,
    goal,
    stats: stats.slice(0, MAX_STATS),
  };
}

function buildTaskContent(
  subject: TaskShareSubject,
  now: Date,
): ShareCardContent {
  const stats: ShareStat[] = [];
  if (subject.completedFocus > 0) {
    stats.push({
      value: String(subject.completedFocus),
      label: i18next.t("share.card.pomodoros", {
        count: subject.completedFocus,
      }),
    });
  }
  if (subject.activeDays > 0) {
    stats.push({
      value: String(subject.activeDays),
      label: i18next.t("share.card.days", { count: subject.activeDays }),
    });
  }
  stats.push({
    value: formatShortDate(subject.firstAt, now),
    label: i18next.t("share.card.since"),
  });

  return {
    kind: "task",
    kicker: i18next.t("share.card.kicker.task"),
    title: subject.showLabel ? subject.label : undefined,
    heroCaption: i18next.t("share.card.heroCaption"),
    seconds: subject.focusSeconds,
    stats: stats.slice(0, MAX_STATS),
  };
}

export function buildCardContent(
  subject: ShareSubject,
  now: Date = new Date(),
): ShareCardContent {
  return subject.kind === "day"
    ? buildDayContent(subject, now)
    : buildTaskContent(subject, now);
}

export function buildShareText(
  subject: ShareSubject,
  now: Date = new Date(),
): string {
  const duration = formatShareDuration(subject.focusSeconds);
  if (subject.kind === "day") {
    return isSameLocalDay(subject.date, now)
      ? i18next.t("share.text.today", { duration })
      : i18next.t("share.text.otherDay", {
          date: formatLongDate(subject.date),
          duration,
        });
  }
  return subject.showLabel
    ? i18next.t("share.text.taskWithLabel", { duration, label: subject.label })
    : i18next.t("share.text.taskWithoutLabel", { duration });
}

export function buildShareCaption(
  subject: ShareSubject,
  url: string,
  now: Date = new Date(),
): string {
  return `${buildShareText(subject, now)}\n${url}`;
}
