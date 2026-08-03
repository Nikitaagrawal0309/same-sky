/**
 * Rituals — the consistent, real-life acts of care that quietly shape the
 * shared world.
 *
 * A ritual is not a task and never a checkbox. Nothing here should imply debt,
 * failure or obligation; the vocabulary is deliberately "honour a ritual"
 * rather than "complete a task".
 *
 * The catalogue itself lives in `services/ritual.ts`. Adding a ritual means
 * adding one entry there and one member to `RitualId` — no other file changes.
 */

export type RitualId =
  // Body
  | "wake-up"
  | "sleep"
  | "hydration"
  | "healthy-meals"
  | "exercise"
  | "walking"
  | "vitamins"
  | "yoga"
  // Mind
  | "meditation"
  | "reading"
  | "journaling"
  | "gratitude"
  | "digital-detox"
  // Craft
  | "study"
  | "deep-work"
  | "creative-work"
  // Together
  | "good-morning"
  | "good-night"
  | "appreciation"
  | "shared-meal"
  | "call"
  | "date-night"
  | "acts-of-kindness";

/**
 * The part of a life a ritual tends to. Domains exist to group rituals gently
 * in the interface and to describe growth in reflections — never to score one
 * area of life against another.
 */
export type RitualDomain = "body" | "mind" | "craft" | "together";

/**
 * How often a ritual naturally recurs.
 *
 * Cadence is not a target and missing one is never surfaced as a failure. It
 * exists so that an occasional ritual is weighted proportionally against a
 * daily one when the world grows.
 */
export type RitualCadence = "daily" | "weekly";

/**
 * Visual accent, resolved against the design tokens in `index.css`.
 */
export type RitualAccent = "accent" | "water" | "ember" | "bloom" | "dusk";

/**
 * The name of a ritual's icon.
 *
 * Stored as a name rather than a component so the catalogue stays free of
 * React and the ritual service remains pure. `components/ritual/RitualIcon`
 * resolves a name to a drawn icon.
 */
export type RitualIconName =
  | "sunrise"
  | "moon"
  | "droplet"
  | "salad"
  | "dumbbell"
  | "footprints"
  | "pill"
  | "flower"
  | "brain"
  | "book"
  | "pen"
  | "sparkle"
  | "phone-off"
  | "graduation"
  | "target"
  | "palette"
  | "sun"
  | "stars"
  | "heart"
  | "utensils"
  | "phone"
  | "wine"
  | "gift";

export interface RitualDefinition {
  id: RitualId;

  label: string;

  /**
   * A short, warm invitation. Written in the second person and never
   * prescriptive about amount, duration or intensity.
   */
  description: string;

  domain: RitualDomain;

  cadence: RitualCadence;

  /**
   * Energy contributed to the shared world each time this ritual is honoured.
   *
   * Weekly rituals carry more energy per occurrence purely because they occur
   * less often — over a month, every ritual contributes comparably. This is
   * normalisation, not reward: no ritual is "worth more" than another.
   */
  energy: number;

  accent: RitualAccent;

  icon: RitualIconName;

  /**
   * Together-rituals are shared moments. Both partners may honour the same
   * ritual on the same day, and doing so is the point.
   */
  isShared: boolean;
}

/**
 * A single honoured ritual.
 *
 * Stored at `rituals/{worldId}/{date}/{uid}/{ritualId}`, where `date` is the
 * local calendar day of the person who honoured it — two partners in different
 * time zones each live in their own day.
 */
export interface RitualEntry {
  ritualId: RitualId;

  uid: string;

  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;

  honouredAt: number;

  /** Energy this entry contributed, captured at the time it was honoured. */
  energy: number;

  /** An optional single line of reflection. Never required. */
  note: string | null;
}

/**
 * Every ritual a person honoured on one local day, keyed by ritual.
 */
export type DailyRitualRecord = Partial<Record<RitualId, RitualEntry>>;

/**
 * One local day for both partners, as stored under `rituals/{worldId}/{date}`.
 */
export type DailyRitualLedger = Record<string, DailyRitualRecord>;

/**
 * The set of rituals a person has chosen to keep.
 *
 * Stored at `ritualPlans/{worldId}/{uid}`. Each partner curates their own
 * practice; neither can edit the other's.
 */
export interface RitualPlan {
  uid: string;

  ritualIds: RitualId[];

  updatedAt: number;
}

/**
 * A ritual paired with the current person's progress on it today. Built by the
 * ritual service for direct consumption by the interface.
 */
export interface RitualStatus {
  definition: RitualDefinition;

  /** Whether the signed-in person has honoured this ritual today. */
  honouredBySelf: boolean;

  /** Whether their partner has honoured this ritual today. */
  honouredByPartner: boolean;

  honouredAt: number | null;
}
