/**
 * Daily moods, badges, seeds and the sown garden.
 *
 * Badges and which seeds are unlocked are never stored: like the rest of the
 * world they are derived from ritual history (see `services/badges.ts`), so
 * they can never drift from what two people actually did. Only two choices
 * are stored: each person's mood for the day, and which seed was sown in
 * which garden plot.
 */

/* -------------------------------------------------------------------------
   Daily mood check-in
   ------------------------------------------------------------------------- */

export type DailyMood = "happy" | "loved" | "calm" | "tender" | "sleepy" | "low";

export interface DailyMoodDefinition {
  id: DailyMood;
  emoji: string;
  label: string;
  /** The journal mood (and so the paper template) this check-in suggests. */
  journalMood: "bright" | "warm" | "steady" | "tender" | "heavy";
  /** Soft background for the selected state. */
  tint: string;
}

export const DAILY_MOODS: readonly DailyMoodDefinition[] = [
  { id: "happy", emoji: "😄", label: "Happy", journalMood: "bright", tint: "#ffe9a8" },
  { id: "loved", emoji: "🥰", label: "Loved", journalMood: "warm", tint: "#ffd1dd" },
  { id: "calm", emoji: "😌", label: "Calm", journalMood: "steady", tint: "#cdeed5" },
  { id: "tender", emoji: "🥺", label: "Tender", journalMood: "tender", tint: "#ffdcc7" },
  { id: "sleepy", emoji: "😴", label: "Sleepy", journalMood: "steady", tint: "#d3e6f7" },
  { id: "low", emoji: "😔", label: "Low", journalMood: "heavy", tint: "#dfe3ea" },
];

/** One person's check-in. Stored at `moods/{worldId}/{date}/{uid}`. */
export interface MoodCheckIn {
  mood: DailyMood;
  at: number;
}

/* -------------------------------------------------------------------------
   Seeds and garden weather
   ------------------------------------------------------------------------- */

export type SeedId =
  | "sunflower"
  | "daisy"
  | "tulip"
  | "lavender"
  | "rose-bush"
  | "blueberry-bush"
  | "cherry-tree"
  | "apple-tree"
  | "orange-tree"
  | "mango-tree";

export type PlantKind = "flower" | "bush" | "tree" | "fruit-tree";

export interface SeedDefinition {
  id: SeedId;
  name: string;
  emoji: string;
  kind: PlantKind;
  /** Rituals (by either of you, after sowing) it takes to fully grow. */
  maturesAfter: number;
  blurb: string;
}

export const SEEDS: readonly SeedDefinition[] = [
  { id: "sunflower", name: "Sunflower", emoji: "🌻", kind: "flower", maturesAfter: 10, blurb: "Turns its face to the light." },
  { id: "daisy", name: "Daisy", emoji: "🌼", kind: "flower", maturesAfter: 8, blurb: "Small, cheerful, everywhere." },
  { id: "tulip", name: "Tulip", emoji: "🌷", kind: "flower", maturesAfter: 10, blurb: "A cup of colour in spring." },
  { id: "lavender", name: "Lavender", emoji: "🪻", kind: "flower", maturesAfter: 14, blurb: "Calm you can smell." },
  { id: "rose-bush", name: "Rose bush", emoji: "🌹", kind: "bush", maturesAfter: 24, blurb: "Grown by two, for two." },
  { id: "blueberry-bush", name: "Blueberry bush", emoji: "🫐", kind: "bush", maturesAfter: 28, blurb: "Sweet rewards for steady care." },
  { id: "cherry-tree", name: "Cherry blossom", emoji: "🌸", kind: "tree", maturesAfter: 40, blurb: "A cloud of pink every spring." },
  { id: "apple-tree", name: "Apple tree", emoji: "🍎", kind: "fruit-tree", maturesAfter: 55, blurb: "Bears fruit once it's settled in." },
  { id: "orange-tree", name: "Orange tree", emoji: "🍊", kind: "fruit-tree", maturesAfter: 60, blurb: "Little suns on every branch." },
  { id: "mango-tree", name: "Mango tree", emoji: "🥭", kind: "fruit-tree", maturesAfter: 70, blurb: "The sweetest thing you'll grow together." },
];

export const STARTER_SEEDS: readonly SeedId[] = ["sunflower", "daisy", "tulip"];

export type GardenWeatherId = "clear" | "sunshine" | "rainbow" | "starry" | "aurora";

export const GARDEN_WEATHERS: readonly { id: GardenWeatherId; name: string; emoji: string }[] = [
  { id: "clear", name: "Clear skies", emoji: "🌤️" },
  { id: "sunshine", name: "Golden sunshine", emoji: "☀️" },
  { id: "rainbow", name: "Rainbow", emoji: "🌈" },
  { id: "starry", name: "Starry night", emoji: "🌌" },
  { id: "aurora", name: "Aurora", emoji: "✨" },
];

/** One sown plot. */
export interface GardenPlot {
  seedId: SeedId;
  /** Local day it was sown, `YYYY-MM-DD`. Growth counts rituals from here. */
  plantedOn: string;
  plantedBy: string;
}

/** The shared garden. Stored at `gardens/{worldId}`. */
export interface GardenState {
  plots?: Record<string, GardenPlot>;
  weather?: GardenWeatherId;
}

export const GARDEN_PLOT_COUNT = 6;

/* -------------------------------------------------------------------------
   Badges
   ------------------------------------------------------------------------- */

export type BadgeMetric = "soloWeeks" | "togetherWeeks" | "soloMonths" | "togetherMonths";

export type BadgeKind = "weather" | "plant" | "bush" | "tree" | "fruit-tree";

export interface BadgeDefinition {
  id: string;
  name: string;
  emoji: string;
  kind: BadgeKind;
  metric: BadgeMetric;
  /** How many consistent weeks/months of `metric` it takes. */
  count: number;
  unlocks: { type: "seed"; seedId: SeedId } | { type: "weather"; weatherId: GardenWeatherId };
}

export const BADGES: readonly BadgeDefinition[] = [
  { id: "sunshine", name: "Sunshine", emoji: "☀️", kind: "weather", metric: "soloWeeks", count: 1, unlocks: { type: "weather", weatherId: "sunshine" } },
  { id: "lavender", name: "Lavender field", emoji: "🪻", kind: "plant", metric: "soloWeeks", count: 2, unlocks: { type: "seed", seedId: "lavender" } },
  { id: "rose", name: "Rose bush", emoji: "🌹", kind: "bush", metric: "togetherWeeks", count: 1, unlocks: { type: "seed", seedId: "rose-bush" } },
  { id: "rainbow", name: "Rainbow", emoji: "🌈", kind: "weather", metric: "togetherWeeks", count: 2, unlocks: { type: "weather", weatherId: "rainbow" } },
  { id: "blueberry", name: "Blueberry bush", emoji: "🫐", kind: "bush", metric: "soloWeeks", count: 4, unlocks: { type: "seed", seedId: "blueberry-bush" } },
  { id: "cherry", name: "Cherry blossom", emoji: "🌸", kind: "tree", metric: "togetherWeeks", count: 4, unlocks: { type: "seed", seedId: "cherry-tree" } },
  { id: "apple", name: "Apple tree", emoji: "🍎", kind: "fruit-tree", metric: "soloMonths", count: 1, unlocks: { type: "seed", seedId: "apple-tree" } },
  { id: "starry", name: "Starry night", emoji: "🌌", kind: "weather", metric: "togetherMonths", count: 1, unlocks: { type: "weather", weatherId: "starry" } },
  { id: "orange", name: "Orange tree", emoji: "🍊", kind: "fruit-tree", metric: "soloMonths", count: 2, unlocks: { type: "seed", seedId: "orange-tree" } },
  { id: "mango", name: "Mango tree", emoji: "🥭", kind: "fruit-tree", metric: "togetherMonths", count: 2, unlocks: { type: "seed", seedId: "mango-tree" } },
  { id: "aurora", name: "Aurora", emoji: "✨", kind: "weather", metric: "togetherMonths", count: 3, unlocks: { type: "weather", weatherId: "aurora" } },
];

export const BADGE_METRIC_LABELS: Record<BadgeMetric, { one: string; many: string }> = {
  soloWeeks: { one: "consistent week", many: "consistent weeks" },
  togetherWeeks: { one: "week you're both consistent", many: "weeks you're both consistent" },
  soloMonths: { one: "consistent month", many: "consistent months" },
  togetherMonths: { one: "month you're both consistent", many: "months you're both consistent" },
};

/** A week counts as consistent with this many active days (out of 7). */
export const CONSISTENT_WEEK_DAYS = 5;

/** A month counts as consistent with this many active days. */
export const CONSISTENT_MONTH_DAYS = 20;
