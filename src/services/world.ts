import { PATHS, RECENT_WINDOW_DAYS, WORLD_HISTORY_WINDOW_DAYS } from "../app/constants";
import type { DateKey } from "../types/database";
import type { Hemisphere } from "../types/user";
import type { RitualId } from "../types/ritual";
import type {
  GardenState,
  PartnerContribution,
  PondState,
  SkyPhase,
  SkyState,
  TreeStage,
  TreeState,
  WildlifePresence,
  WorldDaySummary,
  WorldSnapshot,
  WorldState,
} from "../types/world";
import {
  addDaysToKey,
  dayProgress,
  daysBetween,
  getSeason,
  recentDateKeys,
  toDateKey,
  todayKey,
} from "../utils/date";
import {
  clamp01,
  easeOut,
  progressBetween,
  recordToArray,
  round,
  sum,
} from "../utils/helpers";
import { getData, getRange, setData, subscribe, subscribeToRange, transactData } from "./database";
import { recordEvent } from "./timeline";

/**
 * The World Progression Engine.
 *
 * Two ideas govern everything in this file.
 *
 * **Facts are stored; the world is derived.** `WorldState` and the daily
 * summaries record only what two people actually did. The tree, garden, pond
 * and wildlife are recomputed from those facts every time the world is opened.
 * Progression rules will be tuned for years, and this is what makes tuning
 * them safe: no migration, no drift, and a world that is always exactly a
 * function of the life behind it.
 *
 * **The world is kind.** Growing together adds; growing alone never subtracts.
 * A world that has been established does not wither during a hard month — its
 * foundation holds, and only the surface bloom responds to recent weeks.
 * Coming back is always easier than leaving.
 */

/* -------------------------------------------------------------------------
   Tuning
   ------------------------------------------------------------------------- */

/**
 * The share of the quieter partner's daily energy that is added again when
 * both people show up on the same day.
 *
 * Purely additive. A pair where one person is carrying a hard month loses
 * nothing; they simply have not yet received the extra life that arrives when
 * two people tend the world on the same day.
 */
const TOGETHER_BONUS = 0.5;

/**
 * Daily energy at which the world is considered fully alive. Set at a level a
 * real pair reaches comfortably — roughly three rituals each — rather than at
 * an exceptional one. Vitality is not a target to max out.
 */
const HEALTHY_DAILY_ENERGY = 6;

/** Lifetime energy at which the world's permanent foundation is complete. */
const FOUNDATION_ENERGY = 1_200;

/** The most flowers a garden will ever hold at once. */
const MAX_FLOWERS = 24;

/**
 * The tree.
 *
 * Every stage is gated by lifetime energy *and* by days of shared history,
 * and the slower of the two governs. Energy alone cannot rush it: an intense
 * fortnight will not produce a mature tree, because the tree is a record of
 * time spent together, and time cannot be compressed.
 *
 * At a steady pace the final stage is reached somewhere past the first year.
 */
export const TREE_STAGES: readonly TreeStage[] = [
  {
    id: "seed",
    index: 0,
    label: "A seed",
    meaning: "Everything that follows is already in here.",
    energyRequired: 0,
    daysRequired: 0,
  },
  {
    id: "sprout",
    index: 1,
    label: "A sprout",
    meaning: "The first green. Small, and unmistakably alive.",
    energyRequired: 12,
    daysRequired: 3,
  },
  {
    id: "seedling",
    index: 2,
    label: "A seedling",
    meaning: "Leaves enough to catch the light on their own.",
    energyRequired: 45,
    daysRequired: 10,
  },
  {
    id: "sapling",
    index: 3,
    label: "A sapling",
    meaning: "Tall enough to be noticed from across the garden.",
    energyRequired: 120,
    daysRequired: 25,
  },
  {
    id: "young",
    index: 4,
    label: "A young tree",
    meaning: "Roots deeper than the part you can see.",
    energyRequired: 280,
    daysRequired: 55,
  },
  {
    id: "flourishing",
    index: 5,
    label: "A flourishing tree",
    meaning: "A canopy wide enough to change the light beneath it.",
    energyRequired: 600,
    daysRequired: 110,
  },
  {
    id: "sheltering",
    index: 6,
    label: "A sheltering tree",
    meaning: "Shade for anyone who sits under it, including you.",
    energyRequired: 1_200,
    daysRequired: 220,
  },
  {
    id: "ancient",
    index: 7,
    label: "An old tree",
    meaning: "Old enough that people assume it was always here.",
    energyRequired: 2_400,
    daysRequired: 400,
  },
];

/* -------------------------------------------------------------------------
   Creating and reading a world
   ------------------------------------------------------------------------- */

function emptyContribution(uid: string): PartnerContribution {
  return { uid, energy: 0, rituals: 0, activeDays: 0, lastActiveDate: null };
}

export function createInitialWorld(
  worldId: string,
  pairId: string,
  partnerUids: string[],
): WorldState {
  const now = Date.now();

  return {
    worldId,
    pairId,
    createdAt: now,
    updatedAt: now,
    contributions: Object.fromEntries(
      partnerUids.map((uid) => [uid, emptyContribution(uid)]),
    ),
    totalEnergy: 0,
    totalRituals: 0,
    activeDays: 0,
    sharedDays: 0,
    lastActiveDate: null,
  };
}

/**
 * Create the shared world, or leave it exactly as it is.
 *
 * Deliberately never overwrites: this runs both when a pair is created and
 * when the second partner joins, and the second call must not erase whatever
 * the first partner already grew while waiting.
 */
export async function ensureWorld(
  worldId: string,
  pairId: string,
  partnerUids: string[],
): Promise<WorldState> {
  const existing = await getData<WorldState>(PATHS.world(worldId));

  if (!existing) {
    const world = createInitialWorld(worldId, pairId, partnerUids);

    await setData(PATHS.world(worldId), world);

    return world;
  }

  // A partner who joined later needs a contribution record before they can
  // be recognised by the world.
  const contributions = { ...existing.contributions };
  let added = false;

  for (const uid of partnerUids) {
    if (!contributions[uid]) {
      contributions[uid] = emptyContribution(uid);
      added = true;
    }
  }

  if (!added) {
    return existing;
  }

  const updated: WorldState = { ...existing, contributions, updatedAt: Date.now() };

  await setData(PATHS.world(worldId), updated);

  return updated;
}

export async function getWorld(worldId: string): Promise<WorldState | null> {
  return getData<WorldState>(PATHS.world(worldId));
}

/**
 * The shared world is one of the few places a live listener earns its keep:
 * seeing a partner's tree grow while you are looking at it is the product.
 */
export function subscribeToWorld(
  worldId: string,
  callback: (world: WorldState | null) => void,
  onError?: (error: Error) => void,
): () => void {
  return subscribe<WorldState>(PATHS.world(worldId), callback, onError);
}

export async function getWorldHistory(
  worldId: string,
  startDate: DateKey,
  endDate: DateKey,
): Promise<Record<DateKey, WorldDaySummary>> {
  return getRange<WorldDaySummary>(PATHS.worldHistory(worldId), startDate, endDate);
}

/**
 * The trailing window the derived world is built from.
 */
export function subscribeToRecentHistory(
  worldId: string,
  callback: (history: Record<DateKey, WorldDaySummary>) => void,
  windowDays: number = WORLD_HISTORY_WINDOW_DAYS,
  onError?: (error: Error) => void,
): () => void {
  const keys = recentDateKeys(windowDays);

  return subscribeToRange<WorldDaySummary>(
    PATHS.worldHistory(worldId),
    keys[0],
    keys[keys.length - 1],
    callback,
    onError,
  );
}

/* -------------------------------------------------------------------------
   Recording a ritual
   ------------------------------------------------------------------------- */

/**
 * A day's total energy, including the together bonus.
 *
 * Always recomputed from `byPartner` rather than accumulated, so the figure is
 * self-correcting: whatever order writes arrive in, the stored total is a pure
 * function of who did what that day.
 */
function computeDayEnergy(byPartner: Record<string, number>): number {
  const values = Object.values(byPartner).filter((value) => value > 0);

  if (values.length === 0) return 0;

  const base = sum(values);
  const together = values.length >= 2 ? Math.min(...values) * TOGETHER_BONUS : 0;

  return round(base + together);
}

function activePartnerCount(summary: WorldDaySummary | null): number {
  if (!summary?.byPartner) return 0;

  return Object.values(summary.byPartner).filter((value) => value > 0).length;
}

function laterDate(a: DateKey | null, b: DateKey): DateKey {
  // `YYYY-MM-DD` sorts lexicographically in chronological order.
  return a === null || b > a ? b : a;
}

interface RitualDelta {
  worldId: string;
  uid: string;
  ritualId: RitualId;
  date: DateKey;
  energy: number;
}

/**
 * Apply one honoured ritual to the day summary and to the world.
 *
 * Both writes are transactional. Without that, two partners honouring a ritual
 * in the same second would each read the same total and write back the same
 * increment, silently losing one of them.
 */
export async function recordRitual({
  worldId,
  uid,
  ritualId,
  date,
  energy,
}: RitualDelta): Promise<void> {
  const captured: { previous: WorldDaySummary | null } = { previous: null };

  const next = await transactData<WorldDaySummary>(
    PATHS.worldDay(worldId, date),
    (current) => {
      // The final invocation is the one that commits, so this closure always
      // ends up holding the value the commit was actually based on.
      captured.previous = current;

      const byPartner = { ...(current?.byPartner ?? {}) };
      byPartner[uid] = round((byPartner[uid] ?? 0) + energy);

      return {
        date,
        byPartner,
        energy: computeDayEnergy(byPartner),
        rituals: (current?.rituals ?? 0) + 1,
        ritualIds: [...(current?.ritualIds ?? []), ritualId],
      };
    },
  );

  const previous = captured.previous;
  const energyDelta = round(next.energy - (previous?.energy ?? 0));

  const partnerWasActive = (previous?.byPartner?.[uid] ?? 0) > 0;
  const dayWasActive = (previous?.rituals ?? 0) > 0;
  const becameShared = activePartnerCount(previous) < 2 && activePartnerCount(next) >= 2;

  const capturedWorld: { previous: WorldState | null } = { previous: null };

  const nextWorld = await transactData<WorldState>(PATHS.world(worldId), (current) => {
    const world = current ?? createInitialWorld(worldId, worldId, [uid]);
    capturedWorld.previous = world;

    const contribution = world.contributions?.[uid] ?? emptyContribution(uid);

    return {
      ...world,
      contributions: {
        ...world.contributions,
        [uid]: {
          uid,
          energy: round(contribution.energy + energy),
          rituals: contribution.rituals + 1,
          activeDays: contribution.activeDays + (partnerWasActive ? 0 : 1),
          lastActiveDate: laterDate(contribution.lastActiveDate, date),
        },
      },
      totalEnergy: round(world.totalEnergy + energyDelta),
      totalRituals: world.totalRituals + 1,
      activeDays: world.activeDays + (dayWasActive ? 0 : 1),
      sharedDays: world.sharedDays + (becameShared ? 1 : 0),
      lastActiveDate: laterDate(world.lastActiveDate, date),
      updatedAt: Date.now(),
    };
  });

  await recordTreeStageMilestone(capturedWorld.previous, nextWorld, date);
}

/**
 * Notice a tree stage crossed for the first time, and mark it permanently.
 *
 * The tree stage itself is never stored — it is derived fresh from
 * `totalEnergy` and elapsed days every time the world is opened, exactly like
 * everything else in this file. This only records the *moment of crossing* as
 * a one-off timeline entry, which is a fact worth keeping even though the
 * stage that produced it is recomputed rather than stored.
 */
async function recordTreeStageMilestone(
  previousWorld: WorldState | null,
  nextWorld: WorldState,
  date: DateKey,
): Promise<void> {
  const ageInDays = Math.max(
    0,
    daysBetween(toDateKey(new Date(nextWorld.createdAt)), date),
  );

  const previousStage = resolveTree(previousWorld?.totalEnergy ?? 0, ageInDays).stage;
  const nextStage = resolveTree(nextWorld.totalEnergy, ageInDays).stage;

  if (nextStage.index <= previousStage.index) return;

  await recordEvent({
    worldId: nextWorld.worldId,
    type: "tree-stage",
    uid: null,
    title: nextStage.label,
    detail: nextStage.meaning,
    date,
  });
}

/**
 * Reverse a ritual honoured today.
 *
 * The exact mirror of `recordRitual`, floored at zero throughout so that no
 * sequence of events can leave a world holding a negative history.
 */
export async function withdrawRitual({
  worldId,
  uid,
  ritualId,
  date,
  energy,
}: RitualDelta): Promise<void> {
  const captured: { previous: WorldDaySummary | null } = { previous: null };

  const next = await transactData<WorldDaySummary>(
    PATHS.worldDay(worldId, date),
    (current) => {
      captured.previous = current;

      const byPartner = { ...(current?.byPartner ?? {}) };
      byPartner[uid] = Math.max(0, round((byPartner[uid] ?? 0) - energy));

      const ritualIds = [...(current?.ritualIds ?? [])];
      const removeAt = ritualIds.lastIndexOf(ritualId);

      if (removeAt >= 0) {
        ritualIds.splice(removeAt, 1);
      }

      return {
        date,
        byPartner,
        energy: computeDayEnergy(byPartner),
        rituals: Math.max(0, (current?.rituals ?? 0) - 1),
        ritualIds,
      };
    },
  );

  const previous = captured.previous;
  const energyDelta = round(next.energy - (previous?.energy ?? 0));

  const partnerNowInactive = (next.byPartner?.[uid] ?? 0) === 0;
  const dayNowInactive = next.rituals === 0;
  const stoppedBeingShared =
    activePartnerCount(previous) >= 2 && activePartnerCount(next) < 2;

  await transactData<WorldState>(PATHS.world(worldId), (current) => {
    const world = current ?? createInitialWorld(worldId, worldId, [uid]);
    const contribution = world.contributions?.[uid] ?? emptyContribution(uid);

    return {
      ...world,
      contributions: {
        ...world.contributions,
        [uid]: {
          uid,
          energy: Math.max(0, round(contribution.energy - energy)),
          rituals: Math.max(0, contribution.rituals - 1),
          activeDays: Math.max(
            0,
            contribution.activeDays - (partnerNowInactive ? 1 : 0),
          ),
          lastActiveDate: contribution.lastActiveDate,
        },
      },
      totalEnergy: Math.max(0, round(world.totalEnergy + energyDelta)),
      totalRituals: Math.max(0, world.totalRituals - 1),
      activeDays: Math.max(0, world.activeDays - (dayNowInactive ? 1 : 0)),
      sharedDays: Math.max(0, world.sharedDays - (stoppedBeingShared ? 1 : 0)),
      lastActiveDate: world.lastActiveDate,
      updatedAt: Date.now(),
    };
  });
}

/* -------------------------------------------------------------------------
   Deriving the world
   ------------------------------------------------------------------------- */

function resolveTree(totalEnergy: number, ageInDays: number): TreeState {
  let stage = TREE_STAGES[0];

  for (const candidate of TREE_STAGES) {
    if (totalEnergy >= candidate.energyRequired && ageInDays >= candidate.daysRequired) {
      stage = candidate;
    }
  }

  const next = TREE_STAGES[stage.index + 1] ?? null;

  /*
    Progress is governed by whichever requirement is further away, so the
    interface never promises a stage change that time alone will not allow.
  */
  const progress = next
    ? Math.min(
        progressBetween(totalEnergy, stage.energyRequired, next.energyRequired),
        progressBetween(ageInDays, stage.daysRequired, next.daysRequired),
      )
    : 1;

  const lastIndex = TREE_STAGES.length - 1;

  return {
    stage,
    next,
    progress,
    fullness: clamp01((stage.index + progress) / lastIndex),
  };
}

function resolveGarden(foundation: number, vitality: number): GardenState {
  /*
    Sixty per cent of a garden is permanent, grown from everything the pair has
    ever done. Only the remaining forty responds to recent weeks — which is why
    a hard month makes a garden quieter, never barren.
  */
  const lushness = clamp01(foundation * 0.6 + vitality * 0.4);

  return {
    lushness,
    flowers: Math.round(lushness * MAX_FLOWERS),
    varieties: 1 + Math.floor(foundation * 6),
    undergrowth: clamp01(foundation * 0.7 + vitality * 0.3),
  };
}

function resolvePond(foundation: number, vitality: number, harmony: number): PondState {
  const level = clamp01(foundation * 0.5 + vitality * 0.5);

  return {
    level,
    // The pond answers to balance rather than volume: it is clearest when both
    // people have been tending the world, whatever the total.
    clarity: clamp01(0.35 + harmony * 0.65),
    lilies: Math.floor(level * 7),
  };
}

interface WildlifeRule {
  species: WildlifePresence["species"];
  label: string;
  note: string;
  /** Minimum permanent foundation before this creature will settle. */
  foundation: number;
  phases: readonly SkyPhase[];
  seasons?: readonly SkyState["season"][];
  /** Minimum pond level, for creatures that live near water. */
  pond?: number;
  max: number;
}

/**
 * Wildlife is discovered, never unlocked.
 *
 * A creature appears when the world has quietly become somewhere it would
 * choose to live — and only at the hours and in the seasons it would actually
 * be there. Nothing announces an arrival; you simply look one evening and the
 * fireflies are out.
 */
const WILDLIFE_RULES: readonly WildlifeRule[] = [
  {
    species: "butterflies",
    label: "Butterflies",
    note: "Drawn by the first flowers.",
    foundation: 0.12,
    phases: ["morning", "day", "golden"],
    seasons: ["spring", "summer", "autumn"],
    max: 5,
  },
  {
    species: "songbirds",
    label: "Songbirds",
    note: "They sing loudest before the day begins.",
    foundation: 0.2,
    phases: ["dawn", "morning", "golden"],
    max: 4,
  },
  {
    species: "bees",
    label: "Bees",
    note: "A garden worth the journey.",
    foundation: 0.28,
    phases: ["morning", "day", "golden"],
    seasons: ["spring", "summer"],
    max: 6,
  },
  {
    species: "fireflies",
    label: "Fireflies",
    note: "Only where the evenings are still.",
    foundation: 0.34,
    phases: ["dusk", "night"],
    seasons: ["spring", "summer"],
    max: 9,
  },
  {
    species: "dragonflies",
    label: "Dragonflies",
    note: "They arrive once the water settles.",
    foundation: 0.3,
    pond: 0.4,
    phases: ["day", "golden"],
    seasons: ["spring", "summer"],
    max: 3,
  },
  {
    species: "frogs",
    label: "Frogs",
    note: "The pond has become somewhere to live.",
    foundation: 0.4,
    pond: 0.5,
    phases: ["dusk", "night", "deep-night"],
    seasons: ["spring", "summer", "autumn"],
    max: 3,
  },
  {
    species: "rabbits",
    label: "Rabbits",
    note: "Brave enough to cross the open grass.",
    foundation: 0.48,
    phases: ["dawn", "golden", "dusk"],
    max: 3,
  },
  {
    species: "owl",
    label: "An owl",
    note: "It has decided the old tree will do.",
    foundation: 0.7,
    phases: ["night", "deep-night"],
    max: 1,
  },
  {
    species: "deer",
    label: "Deer",
    note: "They only come where nothing has startled them for a long time.",
    foundation: 0.82,
    phases: ["dawn", "dusk"],
    max: 2,
  },
];

function resolveWildlife(
  foundation: number,
  vitality: number,
  pondLevel: number,
  sky: SkyState,
): WildlifePresence[] {
  return WILDLIFE_RULES.filter((rule) => {
    if (foundation < rule.foundation) return false;
    if (!rule.phases.includes(sky.phase)) return false;
    if (rule.seasons && !rule.seasons.includes(sky.season)) return false;
    if (rule.pond !== undefined && pondLevel < rule.pond) return false;

    return true;
  }).map((rule) => {
    // How far past the threshold the world has come, softened by how alive it
    // feels right now — a healthy week brings more of everything out.
    const abundance = clamp01(
      progressBetween(foundation, rule.foundation, 1) * 0.7 + vitality * 0.3,
    );

    return {
      species: rule.species,
      label: rule.label,
      note: rule.note,
      count: Math.max(1, Math.round(abundance * rule.max)),
    };
  });
}

/**
 * How evenly two people have grown together, 0–1.
 *
 * Measured across lifetime contribution rather than the last few days, so a
 * week where one person was travelling does not read as imbalance.
 */
function resolveHarmony(contributions: Record<string, PartnerContribution>): number {
  const energies = recordToArray(contributions)
    .map((contribution) => contribution.energy)
    .filter((energy) => energy > 0);

  if (energies.length < 2) return 0;

  return clamp01(Math.min(...energies) / Math.max(...energies));
}

export interface DeriveWorldOptions {
  /** The trailing daily history, keyed by local date. */
  history: Record<DateKey, WorldDaySummary>;

  /** The viewer's current moment. Injectable so the engine stays testable. */
  now?: Date;

  hemisphere?: Hemisphere;
}

/**
 * Build the complete environment from stored facts.
 *
 * Pure, synchronous and cheap enough to run on every render. It never touches
 * the network and never writes.
 */
export function deriveWorld(
  world: WorldState,
  { history, now = new Date(), hemisphere = "northern" }: DeriveWorldOptions,
): WorldSnapshot {
  const today = toDateKey(now);
  const windowStart = addDaysToKey(today, -(RECENT_WINDOW_DAYS - 1));

  const recentEnergy = round(
    sum(
      Object.entries(history)
        .filter(([date]) => date >= windowStart && date <= today)
        .map(([, day]) => day?.energy ?? 0),
    ),
  );

  const ageInDays = Math.max(0, daysBetween(toDateKey(new Date(world.createdAt)), today));

  /*
    The foundation is everything the pair has ever built. It only ever grows,
    which is what allows someone to return after months away and find their
    world waiting rather than diminished.
  */
  const foundation = easeOut(progressBetween(world.totalEnergy, 0, FOUNDATION_ENERGY));

  const vitality = easeOut(
    clamp01(recentEnergy / (RECENT_WINDOW_DAYS * HEALTHY_DAILY_ENERGY)),
  );

  const harmony = resolveHarmony(world.contributions ?? {});
  const sky = deriveSky(now, hemisphere);

  const pond = resolvePond(foundation, vitality, harmony);

  return {
    tree: resolveTree(world.totalEnergy, ageInDays),
    garden: resolveGarden(foundation, vitality),
    pond,
    wildlife: resolveWildlife(foundation, vitality, pond.level, sky),
    harmony,
    vitality,
    ageInDays,
    recentEnergy,
  };
}

/* -------------------------------------------------------------------------
   The sky
   ------------------------------------------------------------------------- */

const SKY_PHASES: ReadonlyArray<{ until: number; phase: SkyPhase; label: string }> = [
  { until: 5 / 24, phase: "deep-night", label: "The small hours" },
  { until: 7 / 24, phase: "dawn", label: "First light" },
  { until: 10 / 24, phase: "morning", label: "Morning" },
  { until: 17 / 24, phase: "day", label: "Daylight" },
  { until: 19 / 24, phase: "golden", label: "Golden hour" },
  { until: 21 / 24, phase: "dusk", label: "Dusk" },
  { until: 1, phase: "night", label: "Night" },
];

/** A known new moon, used as the origin for the lunar cycle. */
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

const SYNODIC_MONTH_MS = 29.530_588_853 * 86_400_000;

/**
 * The viewer's own sky.
 *
 * This is the one part of the shared world that is not shared. It always shows
 * the real time of day where the person looking at it is standing, so two
 * partners in different time zones tend one world under two different skies —
 * which is exactly the feeling the product is named for.
 */
export function deriveSky(
  now: Date = new Date(),
  hemisphere: Hemisphere = "northern",
): SkyState {
  const progress = dayProgress(now);
  const phase = SKY_PHASES.find((entry) => progress < entry.until) ?? SKY_PHASES[6];

  // -1 at local midnight, +1 at local noon.
  const sunAltitude = -Math.cos(progress * 2 * Math.PI);

  const age = ((now.getTime() - KNOWN_NEW_MOON) % SYNODIC_MONTH_MS) / SYNODIC_MONTH_MS;
  const moonPhase = (1 - Math.cos(age * 2 * Math.PI)) / 2;

  return {
    phase: phase.phase,
    label: phase.label,
    dayProgress: progress,
    sunAltitude,
    moonPhase,
    starsVisible: sunAltitude < -0.12,
    season: getSeason(now, hemisphere),
  };
}

/**
 * A short, warm sentence describing where the world stands right now.
 *
 * Written to be true on the best week and on the worst one, and never to
 * suggest that the reader owes the world anything.
 */
export function describeWorld(snapshot: WorldSnapshot, world: WorldState): string {
  if (world.totalRituals === 0) {
    return "Your world is waiting. It begins the first time either of you tends to something real.";
  }

  if (snapshot.vitality < 0.15) {
    return "Your world has been quiet lately. It kept everything you grew, and it is ready whenever you are.";
  }

  if (snapshot.harmony > 0.75 && snapshot.vitality > 0.5) {
    return "Both of you have been here. It shows in everything from the canopy down to the water.";
  }

  if (snapshot.vitality > 0.6) {
    return "Your world is thriving. Recent weeks have left their mark on it.";
  }

  return "Your world is steady. Slow growth is still growth.";
}

/**
 * The trailing history window used across the application.
 */
export function historyWindow(days: number = WORLD_HISTORY_WINDOW_DAYS): {
  start: DateKey;
  end: DateKey;
} {
  const end = todayKey();

  return { start: addDaysToKey(end, -(days - 1)), end };
}
