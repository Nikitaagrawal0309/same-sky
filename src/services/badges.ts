import type { DateKey } from "../types/database";
import type { WorldDaySummary } from "../types/world";
import {
  BADGES,
  BADGE_METRIC_LABELS,
  SEEDS,
  CONSISTENT_MONTH_DAYS,
  CONSISTENT_WEEK_DAYS,
  GARDEN_WEATHERS,
  STARTER_SEEDS,
  type BadgeDefinition,
  type BadgeMetric,
  type GardenWeatherId,
  type SeedId,
} from "../types/garden";
import { startOfWeek, fromDateKey, toDateKey } from "../utils/date";

/**
 * Badges, derived.
 *
 * Nothing about a badge is stored. Every badge is a pure function of the
 * world's daily history, the same way the tree and garden are. That means a
 * badge can never be lost, never be granted by mistake, and the rules can be
 * tuned later without migrating any data.
 *
 * A consistent week is one with at least `CONSISTENT_WEEK_DAYS` active days;
 * a consistent month has at least `CONSISTENT_MONTH_DAYS`. "Together" counts
 * only the weeks and months in which *both* partners were consistent.
 */

export type ConsistencyCounts = Record<BadgeMetric, number>;

export interface BadgeStatus {
  badge: BadgeDefinition;
  unlocked: boolean;
  /** The day the badge was earned, when it has been. */
  unlockedOn: DateKey | null;
  /** Progress toward `badge.count`. */
  current: number;
}

export interface BadgeSummary {
  counts: ConsistencyCounts;
  badges: BadgeStatus[];
  unlockedSeeds: Set<SeedId>;
  unlockedWeathers: Set<GardenWeatherId>;
}

interface PeriodTally {
  /** Active dates for me and for my partner, in date order. */
  mine: DateKey[];
  theirs: DateKey[];
}

function isActive(day: WorldDaySummary, uid: string | null): boolean {
  if (!uid) return false;

  return (day.byPartner?.[uid] ?? 0) > 0;
}

/**
 * Walk the history in order and record, for each metric, the date on which
 * each successive consistent week/month was reached.
 */
export function deriveBadges(
  history: Record<DateKey, WorldDaySummary>,
  uid: string | null,
  partnerUid: string | null,
): BadgeSummary {
  const dates = Object.keys(history).sort();

  const weeks = new Map<string, PeriodTally>();
  const months = new Map<string, PeriodTally>();

  for (const date of dates) {
    const day = history[date];
    const weekKey = toDateKey(startOfWeek(fromDateKey(date)));
    const monthKey = date.slice(0, 7);

    for (const [map, key] of [
      [weeks, weekKey],
      [months, monthKey],
    ] as const) {
      const tally = map.get(key) ?? { mine: [], theirs: [] };

      if (isActive(day, uid)) tally.mine.push(date);
      if (isActive(day, partnerUid)) tally.theirs.push(date);

      map.set(key, tally);
    }
  }

  // The dates on which each metric ticked up, in order.
  const milestones: Record<BadgeMetric, DateKey[]> = {
    soloWeeks: [],
    togetherWeeks: [],
    soloMonths: [],
    togetherMonths: [],
  };

  const record = (tallies: Map<string, PeriodTally>, threshold: number, solo: BadgeMetric, together: BadgeMetric) => {
    for (const key of [...tallies.keys()].sort()) {
      const { mine, theirs } = tallies.get(key)!;

      if (mine.length >= threshold) {
        milestones[solo].push(mine[threshold - 1]);

        if (theirs.length >= threshold) {
          const reached = mine[threshold - 1] > theirs[threshold - 1] ? mine[threshold - 1] : theirs[threshold - 1];
          milestones[together].push(reached);
        }
      }
    }
  };

  record(weeks, CONSISTENT_WEEK_DAYS, "soloWeeks", "togetherWeeks");
  record(months, CONSISTENT_MONTH_DAYS, "soloMonths", "togetherMonths");

  const counts: ConsistencyCounts = {
    soloWeeks: milestones.soloWeeks.length,
    togetherWeeks: milestones.togetherWeeks.length,
    soloMonths: milestones.soloMonths.length,
    togetherMonths: milestones.togetherMonths.length,
  };

  const unlockedSeeds = new Set<SeedId>(STARTER_SEEDS);
  const unlockedWeathers = new Set<GardenWeatherId>([GARDEN_WEATHERS[0].id]);

  const badges = BADGES.map((badge) => {
    const reached = milestones[badge.metric];
    const unlocked = reached.length >= badge.count;

    if (unlocked) {
      if (badge.unlocks.type === "seed") unlockedSeeds.add(badge.unlocks.seedId);
      else unlockedWeathers.add(badge.unlocks.weatherId);
    }

    return {
      badge,
      unlocked,
      unlockedOn: unlocked ? reached[badge.count - 1] : null,
      current: Math.min(reached.length, badge.count),
    };
  });

  return { counts, badges, unlockedSeeds, unlockedWeathers };
}

/** Which badge unlocks a given seed or weather, for "locked" hints. */
export function badgeUnlocking(target: { seedId?: SeedId; weatherId?: GardenWeatherId }): BadgeDefinition | undefined {
  return BADGES.find((badge) =>
    badge.unlocks.type === "seed"
      ? badge.unlocks.seedId === target.seedId
      : badge.unlocks.weatherId === target.weatherId,
  );
}

export function badgeUnlockText(status: BadgeStatus): string {
  const { unlocks } = status.badge;

  if (unlocks.type === "seed") {
    const seed = SEEDS.find((candidate) => candidate.id === unlocks.seedId);
    return `Unlocks ${seed?.emoji ?? ""} ${seed?.name ?? "a new seed"} seeds`;
  }

  const weather = GARDEN_WEATHERS.find((candidate) => candidate.id === unlocks.weatherId);
  return `Unlocks ${weather?.emoji ?? ""} ${weather?.name ?? "a new weather"} in your garden`;
}

export function badgeRequirementText(status: BadgeStatus): string {
  const labels = BADGE_METRIC_LABELS[status.badge.metric];
  return `${status.badge.count} ${status.badge.count === 1 ? labels.one : labels.many}`;
}
