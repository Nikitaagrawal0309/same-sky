/**
 * The shape of the Firebase Realtime Database.
 *
 * This interface is documentation with teeth: it is the one place that
 * describes where everything in Same Sky lives. `services/database.ts` builds
 * every path from it, so a rename here is a compile error at every call site
 * rather than a silent read of a path that does not exist.
 *
 * Nothing under these paths is ever deleted by the application. A pair's
 * journals, memories, plans, reflections and world history are a permanent
 * archive — preserving them is a product commitment, not an implementation
 * detail.
 */

import type { Pair, PairInvite } from "./pair";
import type { UserProfile } from "./user";
import type { WorldDaySummary, WorldEvent, WorldState } from "./world";
import type { DailyRitualLedger, RitualPlan } from "./ritual";
import type { DailyNote } from "./note";
import type { JournalEntry } from "./journal";
import type { Memory } from "./memory";
import type { Plan, Reflection } from "./planning";

/** A local calendar day key, `YYYY-MM-DD`. */
export type DateKey = string;

/** An ISO week key, `YYYY-Www` — for example `2026-W31`. */
export type WeekKey = string;

/** A calendar month key, `YYYY-MM`. */
export type MonthKey = string;

export interface DatabaseSchema {
  /** `users/{uid}` */
  users: Record<string, UserProfile>;

  /** `inviteCodes/{inviteCode}` */
  inviteCodes: Record<string, PairInvite>;

  /** `pairs/{pairId}` */
  pairs: Record<string, Pair>;

  /** `worlds/{worldId}` */
  worlds: Record<string, WorldState>;

  /** `worldHistory/{worldId}/{date}` */
  worldHistory: Record<string, Record<DateKey, WorldDaySummary>>;

  /** `rituals/{worldId}/{date}/{uid}/{ritualId}` */
  rituals: Record<string, Record<DateKey, DailyRitualLedger>>;

  /** `ritualPlans/{worldId}/{uid}` */
  ritualPlans: Record<string, Record<string, RitualPlan>>;

  /** `notes/{worldId}/{date}/{uid}` */
  notes: Record<string, Record<DateKey, Record<string, DailyNote>>>;

  /** `journal/{worldId}/{entryId}` */
  journal: Record<string, Record<string, JournalEntry>>;

  /** `memories/{worldId}/{memoryId}` */
  memories: Record<string, Record<string, Memory>>;

  /** `plans/{worldId}/{periodKey}` */
  plans: Record<string, Record<string, Plan>>;

  /** `reflections/{worldId}/{periodKey}` */
  reflections: Record<string, Record<string, Reflection>>;

  /** `timeline/{worldId}/{eventId}` */
  timeline: Record<string, Record<string, WorldEvent>>;
}

export type DatabaseRoot = keyof DatabaseSchema;
