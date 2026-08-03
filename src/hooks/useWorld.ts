import { useEffect, useMemo, useState } from "react";

import type { PartnerSummary } from "../types/user";
import type { RitualStatus } from "../types/ritual";
import type { SkyState, WorldSnapshot, WorldState } from "../types/world";
import { buildRitualStatuses, completionOf } from "../services/ritual";
import { deriveSky, deriveWorld } from "../services/world";
import { getPartnerUid } from "../services/pair";
import { useUiStore } from "../store/uiStore";
import { useWorldStore } from "../store/worldStore";
import { useUid } from "./useAuth";

/**
 * Reading the shared world.
 *
 * The store holds stored facts; these hooks turn them into the living
 * environment. The derivation is pure and cheap, so it is recomputed rather
 * than cached anywhere that could go stale — a sky that is right only until
 * the hour changes is worse than no sky at all.
 */

/**
 * The current moment, re-read on an interval.
 *
 * A minute is the right resolution for a world that changes with the light.
 * Anything faster would re-render the entire scene for no visible difference;
 * anything slower would let the sky lag behind the window.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    /*
      A machine that slept through the afternoon must not wake showing a
      morning sky, and no interval fires while it is asleep.
    */
    const handleVisibility = (): void => {
      if (document.visibilityState === "visible") {
        setNow(new Date());
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs]);

  return now;
}

/**
 * The viewer's own sky — always their local hour, never their partner's.
 */
export function useSky(): SkyState {
  const now = useNow();
  const hemisphere = useUiStore((state) => state.hemisphere);

  return useMemo(() => deriveSky(now, hemisphere), [now, hemisphere]);
}

/**
 * The complete derived environment, or `null` before the world has loaded.
 */
export function useWorldSnapshot(): WorldSnapshot | null {
  const world = useWorldStore((state) => state.world);
  const history = useWorldStore((state) => state.history);
  const hemisphere = useUiStore((state) => state.hemisphere);
  const now = useNow();

  return useMemo(() => {
    if (!world) return null;

    return deriveWorld(world, { history, now, hemisphere });
  }, [world, history, now, hemisphere]);
}

export function useWorldState(): WorldState | null {
  return useWorldStore((state) => state.world);
}

export function useWorldStatus(): "idle" | "loading" | "ready" | "error" {
  return useWorldStore((state) => state.status);
}

/**
 * The other person, reduced to what the interface may say about them.
 *
 * `null` while a pair is still waiting to be joined — the invitation has been
 * sent but nobody has walked through the door yet.
 */
export function usePartner(): PartnerSummary | null {
  const partner = useWorldStore((state) => state.partner);
  const uid = useUid();

  return useMemo(() => {
    if (!partner || !uid) return null;

    return {
      uid: partner.uid,
      displayName: partner.displayName,
      photoURL: partner.photoURL,
      isSelf: false,
    };
  }, [partner, uid]);
}

/** `true` once both people are in the world. */
export function useHasPartner(): boolean {
  const pair = useWorldStore((state) => state.pair);
  const uid = useUid();

  return Boolean(pair && uid && getPartnerUid(pair, uid));
}

interface TodayRituals {
  statuses: RitualStatus[];

  /** How much of the person's own practice they have tended to, 0–1. */
  completion: number;

  /** The viewer's local day, `YYYY-MM-DD`. */
  date: string;

  honour: (ritualId: RitualStatus["definition"]["id"]) => Promise<boolean>;

  release: (ritualId: RitualStatus["definition"]["id"]) => Promise<void>;
}

/**
 * Today, for the person looking.
 *
 * Combines their chosen practice with what both partners have actually
 * honoured, so no component has to understand the ledger's shape.
 */
export function useTodayRituals(): TodayRituals {
  const plan = useWorldStore((state) => state.ritualPlan);
  const ledger = useWorldStore((state) => state.ledger);
  const pair = useWorldStore((state) => state.pair);
  const date = useWorldStore((state) => state.today);
  const honour = useWorldStore((state) => state.honour);
  const release = useWorldStore((state) => state.release);
  const uid = useUid();

  const statuses = useMemo(() => {
    if (!plan || !uid) return [];

    const partnerUid = pair && uid ? getPartnerUid(pair, uid) : null;

    return buildRitualStatuses(plan, ledger, uid, partnerUid);
  }, [plan, ledger, pair, uid]);

  return {
    statuses,
    completion: completionOf(statuses),
    date,
    honour,
    release,
  };
}
