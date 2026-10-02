import { useCallback, useEffect, useMemo, useState } from "react";

import { PATHS } from "../app/constants";
import type { DateKey } from "../types/database";
import type { RitualId } from "../types/ritual";
import {
  DEFAULT_GOALS,
  LATE_NIGHT_CUTOFF_HOUR,
  TRACKER_RITUALS,
  type DailyMeasures,
  type FocusSession,
  type TrackerGoals,
} from "../types/trackers";
import { removeData, setData, subscribe, subscribeToRange, transactData, updateData } from "../services/database";
import { honourRitual, releaseRitual } from "../services/ritual";
import { playChime } from "../services/audio";
import { getPartnerUid } from "../services/pair";
import { useWorldStore } from "../store/worldStore";
import { addDaysToKey, toDateKey } from "../utils/date";
import { useUid } from "./useAuth";

/** "06:52" for a Date, in the viewer's own clock. */
function clockTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export interface TrackerControls {
  ready: boolean;
  myGoals: TrackerGoals;
  partnerGoals: TrackerGoals | null;
  mine: DailyMeasures;
  partner: DailyMeasures | null;
  partnerUid: string | null;
  myFocus: FocusSession | null;
  partnerFocus: FocusSession | null;
  addWater: (delta: 1 | -1) => Promise<void>;
  setSteps: (steps: number) => Promise<void>;
  checkInWake: () => Promise<void>;
  undoWake: () => Promise<void>;
  checkInSleep: () => Promise<void>;
  undoSleep: () => Promise<void>;
  /** Start a session; joining a partner passes their `endsAt` so you finish together. */
  startFocus: (minutes: number, together?: boolean, endsAt?: number) => Promise<void>;
  cancelFocus: () => Promise<void>;
  completeFocus: () => Promise<void>;
  saveGoals: (changes: Partial<TrackerGoals>) => Promise<void>;
}

export function useTrackers(): TrackerControls {
  const pair = useWorldStore((state) => state.pair);
  const today = useWorldStore((state) => state.today);
  const ledger = useWorldStore((state) => state.ledger);
  const uid = useUid();
  const worldId = pair?.worldId ?? null;
  const partnerUid = pair && uid ? getPartnerUid(pair, uid) : null;

  const [goals, setGoals] = useState<Record<string, TrackerGoals> | null>(null);
  const [day, setDay] = useState<{ date: DateKey; value: Record<string, DailyMeasures> } | null>(null);
  const [focus, setFocus] = useState<Record<string, FocusSession>>({});

  useEffect(() => {
    if (!worldId) return;

    return subscribe<Record<string, TrackerGoals>>(PATHS.goals(worldId), (value) => setGoals(value ?? {}));
  }, [worldId]);

  useEffect(() => {
    if (!worldId) return;

    return subscribe<Record<string, DailyMeasures>>(`${PATHS.measures(worldId)}/${today}`, (value) =>
      setDay({ date: today, value: value ?? {} }),
    );
  }, [worldId, today]);

  useEffect(() => {
    if (!worldId) return;

    return subscribe<Record<string, FocusSession>>(PATHS.focus(worldId), (value) => setFocus(value ?? {}));
  }, [worldId]);

  const measures = day?.date === today ? day.value : {};
  const myGoals = useMemo(() => ({ ...DEFAULT_GOALS, ...(uid ? goals?.[uid] : undefined) }), [goals, uid]);
  const partnerGoals = partnerUid && goals?.[partnerUid] ? { ...DEFAULT_GOALS, ...goals[partnerUid] } : null;
  const mine = (uid ? measures[uid] : undefined) ?? {};

  const isHonoured = useCallback(
    (ritualId: RitualId) => Boolean(uid && ledger[uid]?.[ritualId]),
    [ledger, uid],
  );

  /** Honour or release the linked ritual so it matches whether the goal is met. */
  const syncRitual = useCallback(
    async (ritualId: RitualId, met: boolean, date: DateKey = today) => {
      if (!worldId || !uid) return;

      if (met && (date !== today || !isHonoured(ritualId))) {
        const { created } = await honourRitual({ worldId, uid, ritualId, date });
        if (created) playChime("ritual-honoured");
      } else if (!met && date === today && isHonoured(ritualId)) {
        await releaseRitual({ worldId, uid, ritualId, date });
      }
    },
    [worldId, uid, today, isHonoured],
  );

  const path = worldId && uid ? PATHS.measuresFor(worldId, today, uid) : null;

  return {
    ready: goals !== null && day !== null,
    myGoals,
    partnerGoals,
    mine,
    partner: partnerUid ? (measures[partnerUid] ?? null) : null,
    partnerUid,
    myFocus: uid ? (focus[uid] ?? null) : null,
    partnerFocus: partnerUid ? (focus[partnerUid] ?? null) : null,

    addWater: async (delta) => {
      if (!path) return;

      const next = await transactData<number>(`${path}/water`, (current) => Math.max(0, Math.min(30, (current ?? 0) + delta)));
      await syncRitual(TRACKER_RITUALS.water, next >= myGoals.water);
    },

    setSteps: async (steps) => {
      if (!path) return;

      const value = Math.max(0, Math.min(100000, Math.round(steps)));
      await setData(`${path}/steps`, value);
      await syncRitual(TRACKER_RITUALS.steps, value >= myGoals.steps);
    },

    checkInWake: async () => {
      if (!path) return;

      const now = new Date();
      await updateData(path, { wakeAt: now.getTime(), wakeTime: clockTime(now) });
      await syncRitual(TRACKER_RITUALS.wake, true);
    },

    undoWake: async () => {
      if (!path) return;

      await updateData(path, { wakeAt: null, wakeTime: null } as never);
      await syncRitual(TRACKER_RITUALS.wake, false);
    },

    checkInSleep: async () => {
      if (!worldId || !uid) return;

      // Going to bed after midnight still counts for the evening before.
      const now = new Date();
      const date = now.getHours() < LATE_NIGHT_CUTOFF_HOUR ? addDaysToKey(toDateKey(now), -1) : today;
      await updateData(PATHS.measuresFor(worldId, date, uid), { sleepAt: now.getTime(), sleepTime: clockTime(now) });
      await syncRitual(TRACKER_RITUALS.sleep, true, date);
    },

    undoSleep: async () => {
      if (!path) return;

      await updateData(path, { sleepAt: null, sleepTime: null } as never);
      await syncRitual(TRACKER_RITUALS.sleep, false);
    },

    startFocus: async (minutes, together = false, endsAt) => {
      if (!worldId || !uid) return;

      const startedAt = Date.now();
      const session: FocusSession = {
        startedAt,
        endsAt: endsAt ?? startedAt + minutes * 60_000,
        minutes,
        ...(together ? { together } : {}),
      };
      await setData(PATHS.focusFor(worldId, uid), session);
    },

    cancelFocus: async () => {
      if (!worldId || !uid) return;

      await removeData(PATHS.focusFor(worldId, uid));
    },

    completeFocus: async () => {
      if (!worldId || !uid || !path) return;

      const session = focus[uid];

      if (!session) return;

      await removeData(PATHS.focusFor(worldId, uid));
      const minutes = await transactData<number>(`${path}/focusMinutes`, (current) => Math.min(1440, (current ?? 0) + session.minutes));
      await transactData<number>(`${path}/focusSessions`, (current) => Math.min(100, (current ?? 0) + 1));
      playChime("milestone");
      await syncRitual(TRACKER_RITUALS.focus, minutes >= myGoals.focusMinutes);
    },

    saveGoals: async (changes) => {
      if (!worldId || !uid) return;

      await setData(PATHS.goalsFor(worldId, uid), { ...myGoals, ...changes });
    },
  };
}

/** Both partners' measures for the trailing `days`, keyed by date then uid. */
export function useMeasureHistory(days = 14): Record<DateKey, Record<string, DailyMeasures>> {
  const pair = useWorldStore((state) => state.pair);
  const today = useWorldStore((state) => state.today);
  const [history, setHistory] = useState<Record<DateKey, Record<string, DailyMeasures>>>({});
  const worldId = pair?.worldId ?? null;
  const start = addDaysToKey(today, -(days - 1));

  useEffect(() => {
    if (!worldId) return;

    return subscribeToRange<Record<string, DailyMeasures>>(PATHS.measures(worldId), start, today, setHistory);
  }, [worldId, start, today]);

  return history;
}
