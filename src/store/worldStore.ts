import { create } from "zustand";

import type { DateKey } from "../types/database";
import type { Pair } from "../types/pair";
import type { DailyRitualLedger, RitualId, RitualPlan } from "../types/ritual";
import type { UserProfile } from "../types/user";
import type { WorldDaySummary, WorldState } from "../types/world";
import { getPartnerUid, subscribeToPair } from "../services/pair";
import {
  honourRitual,
  releaseRitual,
  subscribeToDayLedger,
  subscribeToRitualPlan,
  saveRitualPlan,
} from "../services/ritual";
import { subscribeToUserProfile } from "../services/user";
import { subscribeToRecentHistory, subscribeToWorld } from "../services/world";
import { todayKey } from "../utils/date";

/**
 * The shared world, live.
 *
 * This store holds only *facts read from the database*. Nothing derived is
 * kept here — the tree, garden, pond, wildlife and sky are computed by
 * `services/world.ts` inside `useWorld`, because they depend on the current
 * moment and would go stale the instant they were stored.
 *
 * `attach` opens every listener the world needs and returns a single teardown.
 * It is called once, by the application shell, and nothing else in the
 * codebase subscribes to world data directly.
 */

type WorldStatus = "idle" | "loading" | "ready" | "error";

interface WorldStoreState {
  status: WorldStatus;

  pair: Pair | null;

  /** The other person's profile, or `null` while a pair is still pending. */
  partner: UserProfile | null;

  world: WorldState | null;

  /** The trailing daily history, keyed by local date. */
  history: Record<DateKey, WorldDaySummary>;

  /** The signed-in person's chosen practice. */
  ritualPlan: RitualPlan | null;

  /** Today's rituals for both partners. */
  ledger: DailyRitualLedger;

  /** The viewer's current local day. Re-evaluated as midnight passes. */
  today: DateKey;

  error: string | null;

  /** The uid whose perspective the store is currently loaded for. */
  selfUid: string | null;

  attach: (pairId: string, selfUid: string) => () => void;

  honour: (ritualId: RitualId) => Promise<boolean>;

  release: (ritualId: RitualId) => Promise<void>;

  updatePractice: (ritualIds: RitualId[]) => Promise<void>;
}

/**
 * How often the store checks whether the local day has rolled over.
 *
 * A minute is frequent enough that the change is imperceptible and cheap
 * enough to be irrelevant. It also catches a laptop waking from sleep, which
 * no timer scheduled for midnight would.
 */
const DAY_ROLLOVER_CHECK_MS = 60_000;

export const useWorldStore = create<WorldStoreState>((set, get) => ({
  status: "idle",
  pair: null,
  partner: null,
  world: null,
  history: {},
  ritualPlan: null,
  ledger: {},
  today: todayKey(),
  error: null,
  selfUid: null,

  attach: (pairId, selfUid) => {
    set({ status: "loading", selfUid, error: null });

    /*
      Listeners below the pair depend on knowing the world id and the partner,
      so they are opened once the pair first arrives and are only rebuilt when
      something they depend on actually changes.
    */
    let unsubscribeWorld: (() => void) | undefined;
    let unsubscribeHistory: (() => void) | undefined;
    let unsubscribePlan: (() => void) | undefined;
    let unsubscribeLedger: (() => void) | undefined;
    let unsubscribePartner: (() => void) | undefined;

    let attachedWorldId: string | null = null;
    let attachedPartnerUid: string | null = null;
    let attachedDay: DateKey | null = null;

    function attachLedger(worldId: string, date: DateKey): void {
      unsubscribeLedger?.();
      attachedDay = date;

      unsubscribeLedger = subscribeToDayLedger(worldId, date, (ledger) => {
        set({ ledger });
      });
    }

    const unsubscribePair = subscribeToPair(pairId, (pair) => {
      if (!pair) {
        set({ status: "error", error: "This shared world could not be found." });
        return;
      }

      set({ pair });

      if (attachedWorldId !== pair.worldId) {
        attachedWorldId = pair.worldId;

        unsubscribeWorld?.();
        unsubscribeHistory?.();
        unsubscribePlan?.();

        unsubscribeWorld = subscribeToWorld(pair.worldId, (world) => {
          set({ world, status: "ready" });
        });

        unsubscribeHistory = subscribeToRecentHistory(pair.worldId, (history) => {
          set({ history });
        });

        unsubscribePlan = subscribeToRitualPlan(pair.worldId, selfUid, (plan) => {
          set({ ritualPlan: plan });
        });

        attachLedger(pair.worldId, get().today);
      }

      // A partner appears the moment they accept the invitation. Their profile
      // is what lets the world stop saying "your person" and start using their
      // name.
      const partnerUid = getPartnerUid(pair, selfUid);

      if (partnerUid !== attachedPartnerUid) {
        attachedPartnerUid = partnerUid;

        unsubscribePartner?.();
        unsubscribePartner = undefined;

        if (partnerUid) {
          unsubscribePartner = subscribeToUserProfile(partnerUid, (partner) => {
            set({ partner });
          });
        } else {
          set({ partner: null });
        }
      }
    });

    /*
      The world belongs to whichever day the viewer is actually living in. When
      midnight passes — or a sleeping machine wakes into tomorrow — today's
      rituals become yesterday's and a fresh day opens.
    */
    const dayTimer = window.setInterval(() => {
      const current = todayKey();

      if (current === get().today) return;

      set({ today: current, ledger: {} });

      if (attachedWorldId && attachedDay !== current) {
        attachLedger(attachedWorldId, current);
      }
    }, DAY_ROLLOVER_CHECK_MS);

    return () => {
      window.clearInterval(dayTimer);

      unsubscribePair();
      unsubscribeWorld?.();
      unsubscribeHistory?.();
      unsubscribePlan?.();
      unsubscribeLedger?.();
      unsubscribePartner?.();

      set({
        status: "idle",
        pair: null,
        partner: null,
        world: null,
        history: {},
        ritualPlan: null,
        ledger: {},
        error: null,
        selfUid: null,
      });
    };
  },

  /**
   * Honour a ritual. Returns `true` when this was a new act rather than a
   * repeat, so the interface knows whether there is anything to celebrate.
   *
   * The live ledger listener publishes the result, so nothing is written into
   * the store optimistically — the world a person sees is always the world
   * that actually exists.
   */
  honour: async (ritualId) => {
    const { pair, selfUid, today } = get();

    if (!pair || !selfUid) return false;

    const { created } = await honourRitual({
      worldId: pair.worldId,
      uid: selfUid,
      ritualId,
      date: today,
    });

    return created;
  },

  release: async (ritualId) => {
    const { pair, selfUid, today } = get();

    if (!pair || !selfUid) return;

    await releaseRitual({
      worldId: pair.worldId,
      uid: selfUid,
      ritualId,
      date: today,
    });
  },

  updatePractice: async (ritualIds) => {
    const { pair, selfUid } = get();

    if (!pair || !selfUid) return;

    await saveRitualPlan(pair.worldId, selfUid, ritualIds);
  },
}));
