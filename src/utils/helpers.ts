/**
 * Small, dependency-free helpers shared across the application.
 *
 * Nothing here may know about React, Firebase or any Same Sky domain concept.
 * Anything that does belongs in a service.
 */

/**
 * Compose class names, dropping anything falsy.
 *
 * Kept deliberately tiny rather than pulling in a dependency for eleven lines
 * of logic.
 */
export function cx(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

/** Constrain `value` to the inclusive range `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;

  return Math.min(Math.max(value, min), max);
}

/** Constrain `value` to 0–1. The most common clamp in the world engine. */
export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/** Linear interpolation between `from` and `to` at position `t` (0–1). */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * clamp01(t);
}

/**
 * Where `value` sits between `from` and `to`, as 0–1.
 *
 * Returns 1 rather than dividing by zero when the range is empty, which is the
 * meaningful answer for progression: a threshold you have already reached is
 * fully reached.
 */
export function progressBetween(value: number, from: number, to: number): number {
  if (to <= from) return 1;

  return clamp01((value - from) / (to - from));
}

/**
 * Ease a 0–1 value so growth feels organic rather than linear: quick to show
 * early life, then slowing as it matures.
 */
export function easeOut(t: number): number {
  const clamped = clamp01(t);

  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * A stable pseudo-random number in 0–1 derived from a string.
 *
 * The world must look identical every time it is opened — flowers cannot move
 * between renders — so anything decorative that needs variation derives it
 * from a seed such as a world id, never from `Math.random()`.
 */
export function seededRandom(seed: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  // Convert to an unsigned 32-bit integer, then normalise.
  return (hash >>> 0) / 4_294_967_295;
}

/**
 * A stable sequence of `count` pseudo-random numbers from one seed.
 */
export function seededSequence(seed: string, count: number): number[] {
  return Array.from({ length: count }, (_, index) =>
    seededRandom(`${seed}:${index}`),
  );
}

/* -------------------------------------------------------------------------
   Colour
   ------------------------------------------------------------------------- */

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/**
 * Blend two hex colours, returning `rgb(...)`.
 *
 * Used by the sky, which does not step between times of day but moves
 * continuously through them — the light at 17:40 is genuinely between the
 * light at 17:00 and at 18:30, and it should look it.
 */
export function mixColors(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const amount = clamp01(t);

  const channel = (index: 0 | 1 | 2): number =>
    Math.round(a[index] + (b[index] - a[index]) * amount);

  return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`;
}

/** Sum a list of numbers. */
export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** The arithmetic mean, or 0 for an empty list. */
export function average(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

/**
 * Round to `places` decimals. Energy is stored rounded so that floating-point
 * drift never accumulates across years of writes.
 */
export function round(value: number, places = 2): number {
  const factor = 10 ** places;

  return Math.round(value * factor) / factor;
}

/** Format a 0–1 value as a whole percentage, e.g. `0.62` → `"62%"`. */
export function formatPercent(value: number): string {
  return `${Math.round(clamp01(value) * 100)}%`;
}

/**
 * Turn a full name into initials for an avatar fallback.
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";

  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * The first name only, used wherever the interface speaks to a person warmly.
 */
export function firstNameOf(name: string): string {
  const first = name.trim().split(/\s+/)[0];

  return first || name.trim();
}

/**
 * Collapse whitespace and trim. Applied to everything a person types before it
 * is stored, so entries never differ only by invisible characters.
 */
export function normaliseText(value: string): string {
  return value.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Shorten `value` to `length` characters on a word boundary, appending an
 * ellipsis only when something was actually removed.
 */
export function truncate(value: string, length: number): string {
  if (value.length <= length) return value;

  const cut = value.slice(0, length);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > length * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Group items by a derived key, preserving insertion order within each group.
 */
export function groupBy<T, K extends string>(
  items: T[],
  keyOf: (item: T) => K,
): Record<K, T[]> {
  const groups = {} as Record<K, T[]>;

  for (const item of items) {
    const key = keyOf(item);

    (groups[key] ??= []).push(item);
  }

  return groups;
}

/**
 * Turn a Firebase keyed record into an array, discarding null holes.
 *
 * Realtime Database omits empty children entirely, so a record read back is
 * frequently sparser than its type suggests.
 */
export function recordToArray<T>(
  record: Record<string, T> | null | undefined,
): T[] {
  if (!record) return [];

  return Object.values(record).filter(
    (value): value is T => value !== null && value !== undefined,
  );
}

/**
 * Wait for `ms`. Used sparingly, and only to let a deliberate animation finish
 * before navigating away from it.
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
