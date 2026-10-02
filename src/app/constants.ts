/**
 * Application-wide constants.
 *
 * Routes and database paths are declared once, here, and referenced everywhere
 * else. A string literal for either that appears anywhere outside this file is
 * a bug waiting to happen.
 */

import type { DateKey } from "../types/database";

/* -------------------------------------------------------------------------
   Identity
   ------------------------------------------------------------------------- */

export const APP_NAME = "Same Sky";

export const APP_TAGLINE =
  "No matter where life takes you, you are always under the same sky.";

/* -------------------------------------------------------------------------
   Routes
   ------------------------------------------------------------------------- */

export const ROUTES = {
  home: "/",

  login: "/auth/login",
  register: "/auth/register",

  pair: "/pair",

  /** The shared world — the centre of the product and the signed-in home. */
  world: "/world",

  /** Growth: charts, weekly and monthly reflection, and shared planning. */
  dashboard: "/dashboard",

  journal: "/journal",
  memories: "/memories",
  timeline: "/timeline",

  profile: "/profile",
  settings: "/settings",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/* -------------------------------------------------------------------------
   Database paths
   ------------------------------------------------------------------------- */

/**
 * Every path into the Realtime Database.
 *
 * Mirrors `DatabaseSchema` in `types/database.ts`. Builders are used instead of
 * template literals at call sites so that a change to the tree is made in
 * exactly one place.
 */
export const PATHS = {
  user: (uid: string) => `users/${uid}`,
  userPreferences: (uid: string) => `users/${uid}/preferences`,

  inviteCode: (code: string) => `inviteCodes/${code}`,

  pair: (pairId: string) => `pairs/${pairId}`,

  world: (worldId: string) => `worlds/${worldId}`,

  worldHistory: (worldId: string) => `worldHistory/${worldId}`,
  worldDay: (worldId: string, date: DateKey) => `worldHistory/${worldId}/${date}`,

  rituals: (worldId: string) => `rituals/${worldId}`,
  ritualDay: (worldId: string, date: DateKey) => `rituals/${worldId}/${date}`,
  ritualDayForUser: (worldId: string, date: DateKey, uid: string) =>
    `rituals/${worldId}/${date}/${uid}`,
  ritualEntry: (worldId: string, date: DateKey, uid: string, ritualId: string) =>
    `rituals/${worldId}/${date}/${uid}/${ritualId}`,

  ritualPlan: (worldId: string, uid: string) => `ritualPlans/${worldId}/${uid}`,
  ritualPlans: (worldId: string) => `ritualPlans/${worldId}`,

  notes: (worldId: string) => `notes/${worldId}`,
  notesForDay: (worldId: string, date: DateKey) => `notes/${worldId}/${date}`,
  note: (worldId: string, date: DateKey, uid: string) =>
    `notes/${worldId}/${date}/${uid}`,

  journal: (worldId: string) => `journal/${worldId}`,
  journalEntry: (worldId: string, entryId: string) => `journal/${worldId}/${entryId}`,

  memories: (worldId: string) => `memories/${worldId}`,
  memory: (worldId: string, memoryId: string) => `memories/${worldId}/${memoryId}`,

  plans: (worldId: string) => `plans/${worldId}`,
  plan: (worldId: string, periodKey: string) => `plans/${worldId}/${periodKey}`,

  reflections: (worldId: string) => `reflections/${worldId}`,
  reflection: (worldId: string, periodKey: string) =>
    `reflections/${worldId}/${periodKey}`,

  timeline: (worldId: string) => `timeline/${worldId}`,
  timelineEvent: (worldId: string, eventId: string) => `timeline/${worldId}/${eventId}`,

  /** Daily mood check-ins, `moods/{worldId}/{date}/{uid}`. */
  moods: (worldId: string) => `moods/${worldId}`,
  moodEntry: (worldId: string, date: DateKey, uid: string) => `moods/${worldId}/${date}/${uid}`,

  /** The shared, sown garden: which seed sits in which plot, and its weather. */
  garden: (worldId: string) => `gardens/${worldId}`,
} as const;

/* -------------------------------------------------------------------------
   Local storage
   ------------------------------------------------------------------------- */

/**
 * Keys for the small amount of state that must be readable before the first
 * paint or before a person has signed in.
 *
 * `theme` is also read by the inline script in `index.html`; the two must stay
 * in agreement.
 */
export const STORAGE_KEYS = {
  theme: "same-sky:theme",
  motion: "same-sky:motion",
  ambientAudio: "same-sky:ambient-audio",
  ambientVolume: "same-sky:ambient-volume",
  hemisphere: "same-sky:hemisphere",

  /**
   * On-device copies of moods and the garden, used only if the database
   * refuses those paths (for example before its security rules are updated).
   */
  moodsFallback: (worldId: string) => `same-sky:moods:${worldId}`,
  gardenFallback: (worldId: string) => `same-sky:garden:${worldId}`,

  /** Last live-weather reading and rounded location, so a revisit paints the right sky at once. */
  liveWeather: "same-sky:live-weather",
} as const;

/* -------------------------------------------------------------------------
   Tuning
   ------------------------------------------------------------------------- */

/**
 * How many trailing days of history the world loads to derive its present
 * state. Ninety days is enough for the garden's recent-consistency window and
 * for a three-month view, while staying a very small read.
 */
export const WORLD_HISTORY_WINDOW_DAYS = 90;

/**
 * The window whose consistency the garden and pond respond to. Long enough
 * that a single busy week cannot wilt a garden, short enough that returning
 * after a long absence is visibly rewarded within a month.
 */
export const RECENT_WINDOW_DAYS = 30;
