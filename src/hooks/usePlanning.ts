import { useEffect, useMemo, useState } from "react";

import type { Plan, PlanPeriod } from "../types/planning";
import type { RitualEntry, RitualId } from "../types/ritual";
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
import { addDaysToKey, periodRange } from "../utils/date";
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
 */
export function useReflection(period: PlanPeriod, periodKey: string) {
  const pair = useWorldStore((state) => state.pair);
  const { plan } = usePlan(period, periodKey);

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
