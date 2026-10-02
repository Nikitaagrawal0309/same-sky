/**
 * Daily trackers: water, wake and bedtime, steps and focus.
 *
 * Each tracker is linked to an existing ritual. Reaching your goal (or
 * checking in) honours that ritual, so trackers feed the shared tree,
 * garden, badges and charts exactly like ticking it by hand.
 */

import type { RitualId } from "./ritual";

/** One person's measures for one day. Stored at `measures/{worldId}/{date}/{uid}`. */
export interface DailyMeasures {
  /** Glasses of water. */
  water?: number;
  steps?: number;
  /** When you checked in as awake (epoch ms) and the local clock time, "06:52". */
  wakeAt?: number;
  wakeTime?: string;
  /** When you checked in for bed (epoch ms) and the local clock time, "23:10". */
  sleepAt?: number;
  sleepTime?: string;
  focusMinutes?: number;
  focusSessions?: number;
}

/** One person's goals. Stored at `goals/{worldId}/{uid}`. */
export interface TrackerGoals {
  water: number;
  steps: number;
  /** Target wake-up and bedtime, local "HH:MM". */
  wakeTime: string;
  sleepTime: string;
  /** Focus minutes that count as a full day of deep work. */
  focusMinutes: number;
  /** Length of one focus session, minutes. */
  sessionMinutes: number;
  /** Shared wake-up and bedtime notifications (switched on later). */
  alarms?: boolean;
}

export const DEFAULT_GOALS: TrackerGoals = {
  water: 7,
  steps: 7000,
  wakeTime: "07:00",
  sleepTime: "23:00",
  focusMinutes: 50,
  sessionMinutes: 25,
};

/** A focus session in progress. Stored at `focus/{worldId}/{uid}`. */
export interface FocusSession {
  startedAt: number;
  endsAt: number;
  minutes: number;
  /** Joined from the partner's session, so both finish together. */
  together?: boolean;
}

/** Which ritual each tracker honours. */
export const TRACKER_RITUALS = {
  water: "hydration",
  wake: "wake-up",
  sleep: "sleep",
  steps: "walking",
  focus: "deep-work",
} as const satisfies Record<string, RitualId>;

/** A check-in this close to your target time (in minutes) counts as "on time". */
export const ON_TIME_WINDOW_MINUTES = 30;

/** Before this hour, a bedtime check-in still belongs to the previous day. */
export const LATE_NIGHT_CUTOFF_HOUR = 5;
