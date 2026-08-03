/**
 * The shared world — the heart of Same Sky.
 *
 * The model here draws a hard line between two kinds of data:
 *
 *   • `WorldState` and `WorldDaySummary` store **facts**. They are cumulative,
 *     append-only records of what two people actually did. Nothing in them is
 *     computed, so nothing in them can drift.
 *
 *   • `WorldSnapshot` and everything it contains are **derived**. They are
 *     recomputed from the facts on every render by `services/world.ts`.
 *
 * That separation is deliberate. Progression rules will be tuned for years;
 * being able to change them without migrating stored data is what makes that
 * safe. It also means the world can never be "wrong" — it is always exactly a
 * function of the life the pair has lived.
 */

import type { RitualId } from "./ritual";

/* -------------------------------------------------------------------------
   Stored facts
   ------------------------------------------------------------------------- */

/**
 * One partner's lifetime contribution to the shared world.
 *
 * Contributions are recorded per person so the world can recognise both
 * people, never so they can be compared or ranked against each other.
 */
export interface PartnerContribution {
  uid: string;

  /** Lifetime energy this person has brought to the world. */
  energy: number;

  /** Lifetime count of rituals honoured. */
  rituals: number;

  /** Distinct local days on which this person honoured at least one ritual. */
  activeDays: number;

  /** Local calendar day of their most recent ritual, `YYYY-MM-DD`. */
  lastActiveDate: string | null;
}

/**
 * The persistent record of a pair's shared world. Stored at `worlds/{worldId}`.
 *
 * Every field is cumulative and monotonic. Nothing here ever decreases, which
 * is what allows a person to return after months away and find their world
 * exactly as they left it rather than diminished.
 */
export interface WorldState {
  worldId: string;

  pairId: string;

  createdAt: number;

  updatedAt: number;

  /** Lifetime contribution per partner, keyed by uid. */
  contributions: Record<string, PartnerContribution>;

  /** Lifetime energy from both partners, including the together bonus. */
  totalEnergy: number;

  /** Lifetime rituals honoured across both partners. */
  totalRituals: number;

  /** Distinct days on which at least one partner honoured a ritual. */
  activeDays: number;

  /** Distinct days on which both partners honoured something. */
  sharedDays: number;

  /** Local calendar day of the most recent activity by either partner. */
  lastActiveDate: string | null;
}

/**
 * A single day of the world's life. Stored at `worldHistory/{worldId}/{date}`.
 *
 * These records are small, permanent and never rewritten after the day closes.
 * They power recent-consistency growth, the timeline, reflections and charts,
 * and they are the reason a pair can revisit any week of their history years
 * later.
 */
export interface WorldDaySummary {
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;

  /** Total energy created on this day, including the together bonus. */
  energy: number;

  /** Rituals honoured on this day across both partners. */
  rituals: number;

  /** Energy created on this day, keyed by partner uid. */
  byPartner: Record<string, number>;

  /** Rituals honoured on this day, in the order they were honoured. */
  ritualIds: RitualId[];
}

/* -------------------------------------------------------------------------
   Derived environment
   ------------------------------------------------------------------------- */

/**
 * The tree represents long-term shared growth and moves the slowest of any
 * system in Same Sky. Reaching its later stages takes years, by design.
 */
export type TreeStageId =
  | "seed"
  | "sprout"
  | "seedling"
  | "sapling"
  | "young"
  | "flourishing"
  | "sheltering"
  | "ancient";

export interface TreeStage {
  id: TreeStageId;

  /** Zero-based index of this stage within the full progression. */
  index: number;

  label: string;

  /** A quiet description of what this stage means, shown on the tree itself. */
  meaning: string;

  /** Lifetime energy required before this stage becomes possible. */
  energyRequired: number;

  /** Days of shared history required before this stage becomes possible. */
  daysRequired: number;
}

export interface TreeState {
  stage: TreeStage;

  next: TreeStage | null;

  /** Progress toward `next`, 0–1. `1` when the tree has reached its last stage. */
  progress: number;

  /**
   * Canopy fullness, 0–1. Moves continuously between stages so the tree is
   * never visually static, even when a stage change is far away.
   */
  fullness: number;
}

/**
 * The garden answers to recent consistency, so it is the system a pair feels
 * changing week to week.
 */
export interface GardenState {
  /** Overall richness, 0–1. */
  lushness: number;

  /** Number of flowers currently in bloom. */
  flowers: number;

  /** Distinct flower varieties present. Variety grows more slowly than count. */
  varieties: number;

  /** Ground cover density, 0–1. */
  undergrowth: number;
}

/**
 * The pond reflects peace and balance rather than achievement. It responds to
 * how *together* the growth has been, not how much of it there is.
 */
export interface PondState {
  /** Water level, 0–1. */
  level: number;

  /** Clarity of the water, 0–1. */
  clarity: number;

  /** Lily pads resting on the surface. */
  lilies: number;
}

export type WildlifeSpecies =
  | "butterflies"
  | "bees"
  | "dragonflies"
  | "songbirds"
  | "fireflies"
  | "frogs"
  | "rabbits"
  | "deer"
  | "owl";

/**
 * Wildlife is discovered, never unlocked. A creature appears when the world
 * has quietly become somewhere it would choose to live — and only at the hours
 * and seasons it would actually be there.
 */
export interface WildlifePresence {
  species: WildlifeSpecies;

  label: string;

  /** How many of this creature are present right now. */
  count: number;

  /** A single line describing why this creature is here. */
  note: string;
}

export type Season = "spring" | "summer" | "autumn" | "winter";

/**
 * The phase of a person's own local sky.
 *
 * The sky is personal: it always shows the real time of day where the viewer
 * is standing. Two partners in different time zones look at the same world
 * under two different skies, which is precisely the feeling the product is
 * named for.
 */
export type SkyPhase =
  | "deep-night"
  | "dawn"
  | "morning"
  | "day"
  | "golden"
  | "dusk"
  | "night";

export interface SkyState {
  phase: SkyPhase;

  /** A short, human description of this moment — "Early morning". */
  label: string;

  /** Progress through the local 24-hour day, 0–1. */
  dayProgress: number;

  /** Height of the sun above the horizon, -1 (midnight) to 1 (noon). */
  sunAltitude: number;

  /** Moon illumination, 0–1. Only meaningful at night. */
  moonPhase: number;

  /** `true` while stars are visible. */
  starsVisible: boolean;

  season: Season;
}

/**
 * The complete derived environment at a single moment, for a single viewer.
 *
 * Everything shared (tree, garden, pond, wildlife, harmony, vitality) is
 * identical for both partners. Everything personal (the sky) reflects only the
 * viewer.
 */
export interface WorldSnapshot {
  tree: TreeState;

  garden: GardenState;

  pond: PondState;

  wildlife: WildlifePresence[];

  /**
   * How evenly the two partners have grown together, 0–1.
   *
   * Harmony only ever adds. A world with one very active partner is never
   * worse off than it would have been — it simply hasn't yet received the
   * additional life that growing together brings.
   */
  harmony: number;

  /** Overall health of the world right now, 0–1, from recent consistency. */
  vitality: number;

  /** Days since the world was created. */
  ageInDays: number;

  /** Energy created across the trailing 30 local days. */
  recentEnergy: number;
}

/* -------------------------------------------------------------------------
   Events
   ------------------------------------------------------------------------- */

export type WorldEventType =
  | "world-created"
  | "ritual-honoured"
  | "tree-stage"
  | "wildlife-arrived"
  | "note-left"
  | "journal-entry"
  | "memory-saved"
  | "plan-created"
  | "reflection-ready"
  | "milestone";

/**
 * A permanent entry in the pair's history. Stored at `timeline/{worldId}/{id}`.
 *
 * Timeline entries are never deleted. They are the living record the product
 * exists to accumulate.
 */
export interface WorldEvent {
  id: string;

  type: WorldEventType;

  worldId: string;

  /** The partner this event belongs to, or `null` when it belongs to both. */
  uid: string | null;

  title: string;

  detail: string | null;

  /** Local calendar day the event belongs to, `YYYY-MM-DD`. */
  date: string;

  createdAt: number;
}
