import { useEffect, useMemo, useState } from "react";

import { PATHS, STORAGE_KEYS } from "../app/constants";
import type { DateKey } from "../types/database";
import type { WorldDaySummary } from "../types/world";
import type {
  DailyMood,
  GardenPlot,
  GardenState,
  GardenWeatherId,
  MoodCheckIn,
  SeedId,
} from "../types/garden";
import { deriveBadges, type BadgeSummary } from "../services/badges";
import { getPartnerUids } from "../services/pair";
import { getWorldHistory } from "../services/world";
import { useWorldStore } from "../store/worldStore";
import { toDateKey, todayKey } from "../utils/date";
import { useUid } from "./useAuth";
import { useSyncedValue } from "./useSyncedValue";

/* -------------------------------------------------------------------------
   Moods
   ------------------------------------------------------------------------- */

export interface MoodControls {
  /** Every check-in, keyed by date then uid. */
  byDate: Record<DateKey, Record<string, MoodCheckIn>>;
  mineToday: DailyMood | null;
  partnerToday: DailyMood | null;
  partnerUid: string | null;
  setMood: (mood: DailyMood | null) => Promise<void>;
  local: boolean;
}

export function useMoods(): MoodControls {
  const pair = useWorldStore((state) => state.pair);
  const uid = useUid();
  const worldId = pair?.worldId ?? null;

  const synced = useSyncedValue<Record<DateKey, Record<string, MoodCheckIn>>>(
    worldId ? PATHS.moods(worldId) : null,
    worldId ? STORAGE_KEYS.moodsFallback(worldId) : null,
  );

  const partnerUid = pair && uid ? (getPartnerUids(pair).find((candidate) => candidate !== uid) ?? null) : null;
  const byDate = synced.value ?? {};
  const today = todayKey();

  return {
    byDate,
    mineToday: uid ? (byDate[today]?.[uid]?.mood ?? null) : null,
    partnerToday: partnerUid ? (byDate[today]?.[partnerUid]?.mood ?? null) : null,
    partnerUid,
    local: synced.local,
    setMood: async (mood) => {
      if (!uid) return;

      await synced.write(`${today}/${uid}`, mood ? { mood, at: Date.now() } : null);
    },
  };
}

/* -------------------------------------------------------------------------
   Badges
   ------------------------------------------------------------------------- */

/**
 * Badges from the world's whole history.
 *
 * The world store only keeps the last 90 days live, but a badge earned six
 * months ago must stay earned, so the full history is read once per world
 * (like the yearly overview) and the live window is laid over it so today's
 * progress shows up immediately.
 */
export function useBadges(): BadgeSummary & { loading: boolean; history: Record<DateKey, WorldDaySummary> } {
  const pair = useWorldStore((state) => state.pair);
  const world = useWorldStore((state) => state.world);
  const recent = useWorldStore((state) => state.history);
  const uid = useUid();

  const [full, setFull] = useState<{ worldId: string; history: Record<DateKey, WorldDaySummary> } | null>(null);

  const worldId = pair?.worldId ?? null;
  const createdAt = world?.createdAt ?? null;

  useEffect(() => {
    if (!worldId || createdAt === null) return;

    let cancelled = false;

    void getWorldHistory(worldId, toDateKey(new Date(createdAt)), todayKey())
      .then((history) => {
        if (!cancelled) setFull({ worldId, history });
      })
      .catch(() => {
        if (!cancelled) setFull({ worldId, history: {} });
      });

    return () => {
      cancelled = true;
    };
  }, [worldId, createdAt]);

  const partnerUid = pair && uid ? (getPartnerUids(pair).find((candidate) => candidate !== uid) ?? null) : null;
  const loading = !full || full.worldId !== worldId;

  const history = useMemo(() => ({ ...(full?.history ?? {}), ...recent }), [full, recent]);
  const summary = useMemo(() => deriveBadges(history, uid, partnerUid), [history, uid, partnerUid]);

  return { ...summary, loading, history };
}

/* -------------------------------------------------------------------------
   The sown garden
   ------------------------------------------------------------------------- */

export interface GardenControls {
  plots: Record<string, GardenPlot>;
  weather: GardenWeatherId;
  local: boolean;
  sow: (plotId: string, seedId: SeedId) => Promise<void>;
  uproot: (plotId: string) => Promise<void>;
  setWeather: (weather: GardenWeatherId) => Promise<void>;
}

export function useGarden(): GardenControls {
  const pair = useWorldStore((state) => state.pair);
  const uid = useUid();
  const worldId = pair?.worldId ?? null;

  const synced = useSyncedValue<GardenState>(
    worldId ? PATHS.garden(worldId) : null,
    worldId ? STORAGE_KEYS.gardenFallback(worldId) : null,
  );

  return {
    plots: synced.value?.plots ?? {},
    weather: synced.value?.weather ?? "clear",
    local: synced.local,
    sow: async (plotId, seedId) => {
      if (!uid) return;

      const plot: GardenPlot = { seedId, plantedOn: todayKey(), plantedBy: uid };
      await synced.write(`plots/${plotId}`, plot);
    },
    uproot: (plotId) => synced.write(`plots/${plotId}`, null),
    setWeather: (weather) => synced.write("weather", weather),
  };
}
