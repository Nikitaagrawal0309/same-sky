/**
 * Local time, everywhere.
 *
 * Same Sky is built for two people who may live in different time zones, and
 * the product depends on getting this right: the sky shows each viewer's own
 * hour, and a ritual belongs to the day it was actually lived, not to UTC.
 *
 * Every function here therefore works in the *viewer's local* calendar. The
 * one rule that matters: never build a date key from `toISOString()`, which
 * silently shifts the day for anyone west of Greenwich in the evening.
 */

import type { DateKey, MonthKey, WeekKey } from "../types/database";
import type { Hemisphere } from "../types/user";
import type { Season } from "../types/world";

export const MS_PER_DAY = 86_400_000;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/* -------------------------------------------------------------------------
   Keys
   ------------------------------------------------------------------------- */

/**
 * The local calendar day of `date`, as `YYYY-MM-DD`.
 */
export function toDateKey(date: Date = new Date()): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Local midnight at the start of `key`.
 *
 * Parsed component-wise rather than with `new Date(key)`, which the language
 * specifies as UTC for bare `YYYY-MM-DD` strings.
 */
export function fromDateKey(key: DateKey): Date {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
}

/** The viewer's current local day. */
export function todayKey(): DateKey {
  return toDateKey(new Date());
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = fromDateKey(value);

  return !Number.isNaN(parsed.getTime()) && toDateKey(parsed) === value;
}

/**
 * The ISO-8601 week containing `date`, as `YYYY-Www`.
 *
 * ISO weeks start on Monday and belong to the year containing their Thursday,
 * which is why a day in early January can legitimately belong to week 52 of
 * the previous year.
 */
export function toWeekKey(date: Date = new Date()): WeekKey {
  const thursday = startOfWeek(date);
  thursday.setDate(thursday.getDate() + 3);

  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(
    firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3,
  );

  const week =
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * MS_PER_DAY));

  return `${thursday.getFullYear()}-W${pad(week)}`;
}

/** The calendar month containing `date`, as `YYYY-MM`. */
export function toMonthKey(date: Date = new Date()): MonthKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/* -------------------------------------------------------------------------
   Ranges
   ------------------------------------------------------------------------- */

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

export function addDaysToKey(key: DateKey, days: number): DateKey {
  return toDateKey(addDays(fromDateKey(key), days));
}

/** Local midnight on the Monday of `date`'s week. */
export function startOfWeek(date: Date = new Date()): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // getDay() is Sunday-first; shift so Monday is 0.
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  return start;
}

/** Local midnight on the Sunday of `date`'s week. */
export function endOfWeek(date: Date = new Date()): Date {
  return addDays(startOfWeek(date), 6);
}

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * The inclusive local-day range covered by a period key.
 *
 * Accepts either an ISO week (`2026-W31`) or a calendar month (`2026-08`).
 */
export function periodRange(periodKey: string): { start: DateKey; end: DateKey } {
  if (periodKey.includes("W")) {
    const [yearPart, weekPart] = periodKey.split("-W");
    const year = Number(yearPart);
    const week = Number(weekPart);

    // The Monday of ISO week 1 is the Monday on or before 4 January.
    const jan4 = new Date(year, 0, 4);
    const firstMonday = startOfWeek(jan4);
    const monday = addDays(firstMonday, (week - 1) * 7);

    return { start: toDateKey(monday), end: toDateKey(addDays(monday, 6)) };
  }

  const [year, month] = periodKey.split("-").map(Number);
  const first = new Date(year, month - 1, 1);

  return { start: toDateKey(first), end: toDateKey(endOfMonth(first)) };
}

/**
 * Every local day key from `start` to `end`, inclusive.
 */
export function eachDateKey(start: DateKey, end: DateKey): DateKey[] {
  const keys: DateKey[] = [];

  let cursor = fromDateKey(start);
  const last = fromDateKey(end);

  // Guard against an inverted range rather than looping forever.
  while (cursor.getTime() <= last.getTime()) {
    keys.push(toDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return keys;
}

/**
 * Whole local days from `from` to `to`. Negative when `to` precedes `from`.
 *
 * Both ends are normalised to local midnight first, so daylight-saving
 * transitions cannot produce a fractional day.
 */
export function daysBetween(from: DateKey, to: DateKey): number {
  const start = fromDateKey(from);
  const end = fromDateKey(to);

  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

/**
 * The `count` most recent local days ending today, oldest first.
 */
export function recentDateKeys(count: number, endKey: DateKey = todayKey()): DateKey[] {
  return eachDateKey(addDaysToKey(endKey, -(count - 1)), endKey);
}

/* -------------------------------------------------------------------------
   Formatting
   ------------------------------------------------------------------------- */

/** "Mon" — the shortest useful weekday label. */
export function formatWeekdayShort(key: DateKey): string {
  return fromDateKey(key).toLocaleDateString(undefined, { weekday: "short" });
}

/** "12" — the day of the month, for dense month charts. */
export function formatDayOfMonth(key: DateKey): string {
  return String(fromDateKey(key).getDate());
}

/** "3 August" */
export function formatDayAndMonth(key: DateKey): string {
  return fromDateKey(key).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
  });
}

/** "Monday, 3 August 2026" */
export function formatFullDate(key: DateKey): string {
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "August 2026" */
export function formatMonthName(monthKey: MonthKey): string {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** "20:15" in the viewer's locale. */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * A warm, relative description of a day: "Today", "Yesterday", "Last Tuesday",
 * then an absolute date once relative language stops being useful.
 */
export function formatRelativeDay(key: DateKey, from: DateKey = todayKey()): string {
  const difference = daysBetween(key, from);

  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";
  if (difference === -1) return "Tomorrow";

  if (difference > 1 && difference < 7) {
    return `Last ${fromDateKey(key).toLocaleDateString(undefined, { weekday: "long" })}`;
  }

  const sameYear = fromDateKey(key).getFullYear() === fromDateKey(from).getFullYear();

  return fromDateKey(key).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
  });
}

/**
 * A duration in the vocabulary Same Sky uses for its own history: measured in
 * days, weeks, months and years, never in hours or streaks.
 */
export function formatDuration(days: number): string {
  if (days < 1) return "today";
  if (days === 1) return "1 day";
  if (days < 14) return `${days} days`;

  if (days < 60) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? "1 week" : `${weeks} weeks`;
  }

  if (days < 365) {
    const months = Math.round(days / 30.44);
    return months === 1 ? "1 month" : `${months} months`;
  }

  const years = days / 365.25;

  return years < 1.9
    ? "1 year"
    : `${years.toFixed(years < 10 ? 1 : 0).replace(/\.0$/, "")} years`;
}

/* -------------------------------------------------------------------------
   Time of day and season
   ------------------------------------------------------------------------- */

/**
 * How far through the local day it is, 0 at midnight and approaching 1 just
 * before the next. Sub-minute precision, so the sky moves continuously.
 */
export function dayProgress(date: Date = new Date()): number {
  const minutes =
    date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;

  return minutes / 1440;
}

/**
 * The season at `date` for the given hemisphere.
 *
 * Meteorological seasons are used rather than astronomical ones: they align to
 * whole months, which keeps a season stable for the entire period a monthly
 * reflection covers.
 */
export function getSeason(
  date: Date = new Date(),
  hemisphere: Hemisphere = "northern",
): Season {
  const month = date.getMonth();

  const northern: Season =
    month <= 1 || month === 11
      ? "winter"
      : month <= 4
        ? "spring"
        : month <= 7
          ? "summer"
          : "autumn";

  if (hemisphere === "northern") {
    return northern;
  }

  const opposite: Record<Season, Season> = {
    winter: "summer",
    spring: "autumn",
    summer: "winter",
    autumn: "spring",
  };

  return opposite[northern];
}
