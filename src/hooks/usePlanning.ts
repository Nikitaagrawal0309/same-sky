import { useEffect, useMemo, useState } from "react";

import type { DateKey } from "../types/database";
import type { Plan, PlanPeriod } from "../types/planning";
import type { RitualEntry, RitualId } from "../types/ritual";
import type { WorldDaySummary } from "../types/world";
import { getPartnerUids } from "../services/pair";
import {
  addIntention,
  buildDomainShares,
  buildProgressSeries,
  generateReflection,
  previousPeriodKey,
  removeIntention,
  subscribeToPlan,
} from "../services/planning";
import { getRitualEntriesBetween } from "../services/ritual";
import { getWorldHistory } from "../services/world";
import { addDaysToKey, formatMonthName, periodRange, toMonthKey, todayKey } from "../utils/date";
import { round } from "../utils/helpers";
import { useWorldStore } from "../store/worldStore";
import { useUid } from "./useAuth";

/**
 * A period's plan, live, with the actions needed to write to it.
 */
export function usePlan(period: PlanPeriod, periodKey: string) {
  const pair = useWorldStore((state) => state.pair);
  const uid = useUid();

  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (!pair?.worldId) return;

    return subscribeToPlan(pair.worldId, period, periodKey, setPlan);
  }, [pair?.worldId, period, periodKey]);

  return {
    plan,

    add: async (text: string, ritualId: RitualId | null, isShared: boolean) => {
      if (!pair?.worldId || !uid) return;

      await addIntention({
        worldId: pair.worldId,
        period,
        periodKey,
        authorUid: uid,
        text,
        ritualId,
        isShared,
      });
    },

    remove: async (intentionId: string) => {
      if (!pair?.worldId || !uid) return;

      await removeIntention(pair.worldId, periodKey, intentionId, uid);
    },
  };
}

/**
 * The reflection for a period, computed live from ritual history.
 *
 * Loads the period's entries and the previous period's (for the
 * "most improved" comparison) whenever the period changes, then generates the
 * reflection purely in memory — nothing about a reflection is stored.
 *
 * Takes the period's `plan` as a parameter rather than subscribing to it
 * itself — `GrowthPeriod`, the only caller, already holds one live
 * subscription via `usePlan`, and a second `useReflection`-owned
 * subscription to that exact same path would just be a duplicate listener.
 */
export function useReflection(period: PlanPeriod, periodKey: string, plan: Plan | null) {
  const pair = useWorldStore((state) => state.pair);

  const [entries, setEntries] = useState<RitualEntry[]>([]);
  const [previousEntries, setPreviousEntries] = useState<RitualEntry[]>([]);
  // Tracks which period `entries` actually belongs to, so loading state is
  // derived by comparison rather than reset with a synchronous setState.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!pair?.worldId) return;

    let cancelled = false;

    const { start, end } = periodRange(periodKey);
    const previousRange = periodRange(previousPeriodKey(period, periodKey));

    void getRitualEntriesBetween(pair.worldId, start, end).then((result) => {
      if (cancelled) return;

      setEntries(result);
      setLoadedKey(periodKey);
    });

    void getRitualEntriesBetween(pair.worldId, previousRange.start, previousRange.end).then(
      (result) => {
        if (!cancelled) setPreviousEntries(result);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [pair?.worldId, period, periodKey]);

  const isLoading = loadedKey !== periodKey;

  const reflection = useMemo(() => {
    if (!pair?.worldId || isLoading) return null;

    return generateReflection({
      worldId: pair.worldId,
      period,
      periodKey,
      entries,
      previousEntries,
      partnerUids: getPartnerUids(pair),
      intentionsCount: plan ? Object.keys(plan.intentions).length : 0,
    });
  }, [pair, isLoading, entries, previousEntries, period, periodKey, plan]);

  return { reflection, isLoading };
}

/**
 * The viewer's own completion over the trailing `days`, for the Growth chart.
 */
export function useProgressSeries(practiceRitualIds: RitualId[], days = 14) {
  const pair = useWorldStore((state) => state.pair);
  const uid = useUid();
  const end = useWorldStore((state) => state.today);
  const start = addDaysToKey(end, -(days - 1));

  const [entries, setEntries] = useState<RitualEntry[]>([]);

  useEffect(() => {
    if (!pair?.worldId || !uid) return;

    let cancelled = false;

    void getRitualEntriesBetween(pair.worldId, start, end).then((result) => {
      if (!cancelled) setEntries(result.filter((entry) => entry.uid === uid));
    });

    return () => {
      cancelled = true;
    };
  }, [pair?.worldId, uid, start, end]);

  return useMemo(
    () => buildProgressSeries(entries, practiceRitualIds, start, end),
    [entries, practiceRitualIds, start, end],
  );
}

/**
 * How both partners' recent rituals have been spread across domains.
 */
export function useDomainShares(days = 30) {
  const pair = useWorldStore((state) => state.pair);
  const end = useWorldStore((state) => state.today);
  const start = addDaysToKey(end, -(days - 1));

  const [entries, setEntries] = useState<RitualEntry[]>([]);

  useEffect(() => {
    if (!pair?.worldId) return;

    let cancelled = false;

    void getRitualEntriesBetween(pair.worldId, start, end).then((result) => {
      if (!cancelled) setEntries(result);
    });

    return () => {
      cancelled = true;
    };
  }, [pair?.worldId, start, end]);

  return useMemo(() => buildDomainShares(entries), [entries]);
}

export interface MonthlyOverviewPoint {
  monthKey: string;

  /** "Jan", "Feb" — short, so twelve of them fit one row. */
  label: string;

  rituals: number;

  energy: number;

  isCurrent: boolean;
}

/**
 * Rituals honoured per month, for the trailing `months` — the specification's
 * "yearly: major world evolution" and "monthly: larger environmental
 * changes" timescales, which nothing else on Growth shows. Everything else
 * on the page looks at the last two or four weeks; this is the one place a
 * pair can see a whole year of their own shape.
 *
 * A one-time read (`getWorldHistory`), not a subscription — a year of
 * history changes slowly enough that watching it live would cost far more
 * than it is ever worth.
 */
export function useYearlyOverview(months = 12) {
  const pair = useWorldStore((state) => state.pair);

  const [points, setPoints] = useState<MonthlyOverviewPoint[]>([]);
  // Tracks which world the loaded `points` actually belong to, so loading
  // state is derived by comparison rather than reset with a synchronous
  // setState at the top of the effect.
  const [loadedWorldId, setLoadedWorldId] = useState<string | null>(null);

  useEffect(() => {
    if (!pair?.worldId) return;

    let cancelled = false;

    const today = new Date();
    const currentMonthKey = toMonthKey(today);

    // One buffer day past the first of the earliest month, so that month's
    // 1st is safely inside the read range regardless of time zone rounding.
    const start = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
    const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;

    void getWorldHistory(pair.worldId, startKey, todayKey()).then((history) => {
      if (cancelled) return;

      const byMonth = new Map<string, { rituals: number; energy: number }>();

      for (const [date, day] of Object.entries(history)) {
        const monthKey = date.slice(0, 7);
        const bucket = byMonth.get(monthKey) ?? { rituals: 0, energy: 0 };

        bucket.rituals += day.rituals;
        bucket.energy += day.energy;
        byMonth.set(monthKey, bucket);
      }

      const result: MonthlyOverviewPoint[] = Array.from({ length: months }, (_, index) => {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - (months - 1 - index), 1);
        const monthKey = toMonthKey(monthDate);
        const bucket = byMonth.get(monthKey);

        return {
          monthKey,
          label: formatMonthName(monthKey).split(" ")[0].slice(0, 3),
          rituals: bucket?.rituals ?? 0,
          energy: round(bucket?.energy ?? 0),
          isCurrent: monthKey === currentMonthKey,
        };
      });

      setPoints(result);
      setLoadedWorldId(pair.worldId);
    });

    return () => {
      cancelled = true;
    };
  }, [pair?.worldId, months]);

  return { points, isLoading: loadedWorldId !== pair?.worldId };
}

/**
 * A calendar month's day summaries — the data behind `MonthCalendar`.
 *
 * A one-time read per month, not a subscription: the same reasoning as
 * `useYearlyOverview` applies even more directly here, since a person is
 * very unlikely to sit staring at last month while it changes live. Loading
 * state is derived from comparing `monthKey` against the month the data
 * actually belongs to, so switching months never needs an imperative reset.
 */
export function useCalendarMonth(monthKey: string) {
  const pair = useWorldStore((state) => state.pair);

  const [history, setHistory] = useState<Record<DateKey, WorldDaySummary>>({});
  const [loadedMonthKey, setLoadedMonthKey] = useState<string | null>(null);

  useEffect(() => {
    if (!pair?.worldId) return;

    let cancelled = false;
    const { start, end } = periodRange(monthKey);

    void getWorldHistory(pair.worldId, start, end).then((result) => {
      if (cancelled) return;

      setHistory(result);
      setLoadedMonthKey(monthKey);
    });

    return () => {
      cancelled = true;
    };
  }, [pair?.worldId, monthKey]);

  return { history, isLoading: loadedMonthKey !== monthKey };
}
