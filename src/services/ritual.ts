import { PATHS } from "../app/constants";
import type {
  DailyRitualLedger,
  DailyRitualRecord,
  RitualCadence,
  RitualDefinition,
  RitualDomain,
  RitualEntry,
  RitualId,
  RitualPlan,
  RitualStatus,
} from "../types/ritual";
import { normaliseText, recordToArray } from "../utils/helpers";
import { todayKey } from "../utils/date";
import { getData, getRange, setData, subscribe } from "./database";
import { recordRitual, withdrawRitual } from "./world";

/**
 * The Ritual Engine.
 *
 * A ritual is a consistent act of real-life care. It is never a task, and this
 * file is careful to keep it that way: there is no notion of overdue, no
 * penalty for a missed day, and no state a person can be "behind" on.
 *
 * ── Extending the catalogue ────────────────────────────────────────────────
 * Adding a ritual takes exactly two edits and no architectural change:
 *   1. add its id to `RitualId` in `types/ritual.ts`
 *   2. add its definition to `RITUAL_CATALOGUE` below
 * Everything downstream — the interface, progression, reflections, charts —
 * reads the catalogue and picks it up automatically.
 */

/**
 * Energy contributed each time a ritual is honoured.
 *
 * A weekly ritual carries more per occurrence only because it occurs roughly a
 * third as often within any reflection period. Over a month, a daily ritual
 * and a weekly one contribute comparably. No ritual is worth more than
 * another; this is normalisation, not reward.
 */
const ENERGY_BY_CADENCE: Record<RitualCadence, number> = {
  daily: 1,
  weekly: 3,
};

function define(
  id: RitualId,
  label: string,
  description: string,
  domain: RitualDomain,
  cadence: RitualCadence,
  accent: RitualDefinition["accent"],
  icon: RitualDefinition["icon"],
): RitualDefinition {
  return {
    id,
    label,
    description,
    domain,
    cadence,
    energy: ENERGY_BY_CADENCE[cadence],
    accent,
    icon,
    isShared: domain === "together",
  };
}

/**
 * Every ritual Same Sky knows about.
 *
 * Descriptions are written as invitations. None of them names an amount, a
 * duration or an intensity, because the product has no opinion about how much
 * water is enough water — only that you thought of yourself today.
 */
export const RITUAL_CATALOGUE: readonly RitualDefinition[] = [
  // ── Body ────────────────────────────────────────────────────────────────
  define(
    "wake-up",
    "Wake up",
    "Meet the morning at an hour that suits the life you want.",
    "body",
    "daily",
    "accent",
    "sunrise",
  ),
  define(
    "sleep",
    "Sleep",
    "Let the day end. Rest is not what is left over — it is part of the work.",
    "body",
    "daily",
    "dusk",
    "moon",
  ),
  define(
    "hydration",
    "Water",
    "Water, whenever you remember. Your body keeps a quiet record of it.",
    "body",
    "daily",
    "water",
    "droplet",
  ),
  define(
    "healthy-meals",
    "A good meal",
    "Eat something that leaves you feeling well an hour later.",
    "body",
    "daily",
    "accent",
    "salad",
  ),
  define(
    "exercise",
    "Movement",
    "Move in whatever way your body is asking to move today.",
    "body",
    "daily",
    "accent",
    "dumbbell",
  ),
  define(
    "walking",
    "A walk",
    "Step outside. The air has been doing something without you.",
    "body",
    "daily",
    "accent",
    "footprints",
  ),
  define(
    "vitamins",
    "Vitamins",
    "The small, easily forgotten way you look after yourself.",
    "body",
    "daily",
    "ember",
    "pill",
  ),
  define(
    "yoga",
    "Yoga",
    "Unfold from whatever shape the day has left you in.",
    "body",
    "daily",
    "bloom",
    "flower",
  ),

  // ── Mind ────────────────────────────────────────────────────────────────
  define(
    "meditation",
    "Stillness",
    "Sit with your own company for a while and let it be uneventful.",
    "mind",
    "daily",
    "dusk",
    "brain",
  ),
  define(
    "reading",
    "Reading",
    "A few pages is a few pages. They add up to years.",
    "mind",
    "daily",
    "ember",
    "book",
  ),
  define(
    "journaling",
    "Writing",
    "Put the day into words, however the day actually went.",
    "mind",
    "daily",
    "dusk",
    "pen",
  ),
  define(
    "gratitude",
    "Gratitude",
    "Name one thing that went right. One is enough.",
    "mind",
    "daily",
    "bloom",
    "sparkle",
  ),
  define(
    "digital-detox",
    "Screens down",
    "Set the screens aside and let the room be as quiet as it is.",
    "mind",
    "daily",
    "dusk",
    "phone-off",
  ),

  // ── Craft ───────────────────────────────────────────────────────────────
  define(
    "study",
    "Study",
    "Learn something you will still know a year from now.",
    "craft",
    "daily",
    "ember",
    "graduation",
  ),
  define(
    "deep-work",
    "Deep work",
    "One stretch of undivided attention, given to something that matters.",
    "craft",
    "daily",
    "ember",
    "target",
  ),
  define(
    "creative-work",
    "Making",
    "Make something. Making it badly still counts as making it.",
    "craft",
    "daily",
    "bloom",
    "palette",
  ),

  // ── Together ────────────────────────────────────────────────────────────
  define(
    "good-morning",
    "Good morning",
    "Let them know the day has started for you.",
    "together",
    "daily",
    "ember",
    "sun",
  ),
  define(
    "good-night",
    "Good night",
    "Close the day together, wherever the two of you happen to be.",
    "together",
    "daily",
    "dusk",
    "stars",
  ),
  define(
    "appreciation",
    "Appreciation",
    "Say the thing you usually only think.",
    "together",
    "daily",
    "bloom",
    "heart",
  ),
  define(
    "acts-of-kindness",
    "A kindness",
    "Do the small thing they were not expecting.",
    "together",
    "daily",
    "bloom",
    "gift",
  ),
  define(
    "shared-meal",
    "A meal together",
    "Eat together — at one table, or at two with the call left open.",
    "together",
    "weekly",
    "ember",
    "utensils",
  ),
  define(
    "call",
    "A call",
    "Hear each other's voice. Text carries words, not tone.",
    "together",
    "weekly",
    "water",
    "phone",
  ),
  define(
    "date-night",
    "An evening together",
    "An evening kept for the two of you and nothing else.",
    "together",
    "weekly",
    "bloom",
    "wine",
  ),
];

const CATALOGUE_BY_ID = new Map<RitualId, RitualDefinition>(
  RITUAL_CATALOGUE.map((ritual) => [ritual.id, ritual]),
);

export function getRitual(id: RitualId): RitualDefinition | null {
  return CATALOGUE_BY_ID.get(id) ?? null;
}

export function getRituals(ids: RitualId[]): RitualDefinition[] {
  return ids
    .map((id) => CATALOGUE_BY_ID.get(id))
    .filter((ritual): ritual is RitualDefinition => ritual !== undefined);
}

export function getRitualsByDomain(domain: RitualDomain): RitualDefinition[] {
  return RITUAL_CATALOGUE.filter((ritual) => ritual.domain === domain);
}

export const RITUAL_DOMAIN_ORDER: readonly RitualDomain[] = [
  "body",
  "mind",
  "craft",
  "together",
];

export const RITUAL_DOMAIN_LABELS: Record<RitualDomain, string> = {
  body: "Body",
  mind: "Mind",
  craft: "Craft",
  together: "Together",
};

export const RITUAL_DOMAIN_DESCRIPTIONS: Record<RitualDomain, string> = {
  body: "The care that keeps you well enough to enjoy everything else.",
  mind: "Attention, stillness, and the slow accumulation of thought.",
  craft: "The work you are proud of, and the learning underneath it.",
  together: "The moments that are only possible because there are two of you.",
};

/**
 * What a person starts with.
 *
 * Small on purpose. It is much kinder to grow a practice from four rituals
 * than to be handed twenty-three and choose which ones to fail at.
 */
export const DEFAULT_RITUAL_IDS: readonly RitualId[] = [
  "hydration",
  "walking",
  "reading",
  "good-morning",
  "appreciation",
];

/* -------------------------------------------------------------------------
   A person's chosen practice
   ------------------------------------------------------------------------- */

/**
 * The rituals a person keeps.
 *
 * Each partner curates only their own. Neither can add to, remove from, or
 * even see gaps in the other's practice as something to comment on — the
 * interface shows what a partner *did*, never what they chose not to do.
 */
export async function getRitualPlan(
  worldId: string,
  uid: string,
): Promise<RitualPlan> {
  const stored = await getData<RitualPlan>(PATHS.ritualPlan(worldId, uid));

  if (stored && Array.isArray(stored.ritualIds) && stored.ritualIds.length > 0) {
    // Drop any ids that are no longer in the catalogue rather than rendering
    // an unknown ritual as a blank row.
    return { ...stored, ritualIds: stored.ritualIds.filter((id) => CATALOGUE_BY_ID.has(id)) };
  }

  return { uid, ritualIds: [...DEFAULT_RITUAL_IDS], updatedAt: 0 };
}

export async function saveRitualPlan(
  worldId: string,
  uid: string,
  ritualIds: RitualId[],
): Promise<RitualPlan> {
  const plan: RitualPlan = {
    uid,
    // Preserve catalogue order so the practice always reads the same way.
    ritualIds: RITUAL_CATALOGUE.filter((ritual) => ritualIds.includes(ritual.id)).map(
      (ritual) => ritual.id,
    ),
    updatedAt: Date.now(),
  };

  await setData(PATHS.ritualPlan(worldId, uid), plan);

  return plan;
}

export function subscribeToRitualPlan(
  worldId: string,
  uid: string,
  callback: (plan: RitualPlan) => void,
  onError?: (error: Error) => void,
): () => void {
  return subscribe<RitualPlan>(
    PATHS.ritualPlan(worldId, uid),
    (plan) => {
      callback(
        plan && plan.ritualIds?.length
          ? { ...plan, ritualIds: plan.ritualIds.filter((id) => CATALOGUE_BY_ID.has(id)) }
          : { uid, ritualIds: [...DEFAULT_RITUAL_IDS], updatedAt: 0 },
      );
    },
    onError,
  );
}

/* -------------------------------------------------------------------------
   Honouring a ritual
   ------------------------------------------------------------------------- */

export interface HonourRitualPayload {
  worldId: string;

  uid: string;

  ritualId: RitualId;

  /**
   * The person's own local day. Defaults to today, and is passed explicitly
   * only when catching up on a day that has just rolled over.
   */
  date?: string;

  note?: string;
}

/**
 * Record that a ritual was honoured, and let the world answer.
 *
 * Honouring is idempotent: honouring the same ritual twice on the same day
 * changes nothing and grows nothing, so a double tap can never inflate a
 * world.
 *
 * Returns the entry that now stands, and `created` so the interface knows
 * whether to celebrate.
 */
export async function honourRitual({
  worldId,
  uid,
  ritualId,
  date = todayKey(),
  note,
}: HonourRitualPayload): Promise<{ entry: RitualEntry; created: boolean }> {
  const definition = CATALOGUE_BY_ID.get(ritualId);

  if (!definition) {
    throw new Error(`Unknown ritual: ${ritualId}`);
  }

  const path = PATHS.ritualEntry(worldId, date, uid, ritualId);
  const existing = await getData<RitualEntry>(path);

  if (existing) {
    return { entry: existing, created: false };
  }

  const entry: RitualEntry = {
    ritualId,
    uid,
    date,
    honouredAt: Date.now(),
    energy: definition.energy,
    note: note ? normaliseText(note) : null,
  };

  await setData(path, entry);

  await recordRitual({
    worldId,
    uid,
    ritualId,
    date,
    energy: entry.energy,
  });

  return { entry, created: true };
}

/**
 * Undo a ritual honoured today.
 *
 * Offered because an accidental tap is not a real-life act of care, and a
 * world that reflects real life should not count it. Restricted to the current
 * local day: history that has already closed stays closed, so nobody can go
 * back and edit who they used to be.
 */
export async function releaseRitual({
  worldId,
  uid,
  ritualId,
  date = todayKey(),
}: Omit<HonourRitualPayload, "note">): Promise<boolean> {
  if (date !== todayKey()) {
    return false;
  }

  const path = PATHS.ritualEntry(worldId, date, uid, ritualId);
  const existing = await getData<RitualEntry>(path);

  if (!existing) {
    return false;
  }

  await setData(path, null);

  await withdrawRitual({
    worldId,
    uid,
    ritualId,
    date,
    energy: existing.energy,
  });

  return true;
}

/* -------------------------------------------------------------------------
   Reading the day
   ------------------------------------------------------------------------- */

export async function getDayLedger(
  worldId: string,
  date: string,
): Promise<DailyRitualLedger> {
  return (await getData<DailyRitualLedger>(PATHS.ritualDay(worldId, date))) ?? {};
}

export function subscribeToDayLedger(
  worldId: string,
  date: string,
  callback: (ledger: DailyRitualLedger) => void,
  onError?: (error: Error) => void,
): () => void {
  return subscribe<DailyRitualLedger>(
    PATHS.ritualDay(worldId, date),
    (ledger) => {
      callback(ledger ?? {});
    },
    onError,
  );
}

/**
 * Every ritual entry across a range of local days, oldest first.
 *
 * The single read behind reflections, charts and the timeline.
 */
export async function getRitualEntriesBetween(
  worldId: string,
  startDate: string,
  endDate: string,
): Promise<RitualEntry[]> {
  const days = await getRange<DailyRitualLedger>(
    PATHS.rituals(worldId),
    startDate,
    endDate,
  );

  return Object.keys(days)
    .sort()
    .flatMap((date) =>
      recordToArray<DailyRitualRecord>(days[date]).flatMap((byRitual) =>
        recordToArray<RitualEntry>(byRitual as Record<string, RitualEntry>),
      ),
    );
}

/**
 * Combine a person's chosen practice with what has actually happened today,
 * for both them and their partner.
 *
 * This is the exact shape the interface renders, assembled here so that no
 * component has to reason about the ledger's structure.
 */
export function buildRitualStatuses(
  plan: RitualPlan,
  ledger: DailyRitualLedger,
  selfUid: string,
  partnerUid: string | null,
): RitualStatus[] {
  const mine = ledger[selfUid] ?? {};
  const theirs = partnerUid ? (ledger[partnerUid] ?? {}) : {};

  return getRituals(plan.ritualIds).map((definition) => {
    const entry = mine[definition.id] ?? null;

    return {
      definition,
      honouredBySelf: entry !== null,
      honouredByPartner: (theirs[definition.id] ?? null) !== null,
      honouredAt: entry?.honouredAt ?? null,
    };
  });
}

/**
 * How much of a person's practice they have tended to today, 0–1.
 *
 * Shown as a quiet proportion and never as a target. A day at 0 is described
 * as a rested day, because that is a real and legitimate kind of day.
 */
export function completionOf(statuses: RitualStatus[]): number {
  if (statuses.length === 0) return 0;

  const honoured = statuses.filter((status) => status.honouredBySelf).length;

  return honoured / statuses.length;
}
