import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import type { TrackerControls } from "../../hooks/useTrackers";
import { useNow } from "../../hooks/useWorld";
import type { SeedId } from "../../types/garden";
import { cx } from "../../utils/helpers";
import { PlantArt } from "../garden/PlantArt";
import { TrackerCard } from "./TrackerCard";

const LENGTHS = [15, 25, 45, 60] as const;
const FOCUS_PLANTS: readonly SeedId[] = ["cherry-tree", "sunflower", "apple-tree", "tulip", "orange-tree"];

function mmss(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * A focus timer that grows a plant, like Forest. Stay with it and the plant
 * blooms; give up and it simply rests (no wilting, no guilt). Finished
 * minutes add up toward your daily focus goal, which ticks Deep work.
 * If your person is focusing, you can join so you both finish together.
 */
export function FocusCard({ trackers, partnerName, still }: { trackers: TrackerControls; partnerName: string | null; still: boolean }) {
  const { myFocus, partnerFocus, mine, myGoals } = trackers;
  const now = useNow(1000).getTime();
  const [length, setLength] = useState<number>(myGoals.sessionMinutes);
  const completedFor = useRef<number | null>(null);

  const remaining = myFocus ? myFocus.endsAt - now : 0;
  const elapsedShare = myFocus ? Math.min(1, Math.max(0, (now - myFocus.startedAt) / Math.max(1, myFocus.endsAt - myFocus.startedAt))) : 0;
  const plant = FOCUS_PLANTS[(mine.focusSessions ?? 0) % FOCUS_PLANTS.length];
  const partnerActive = partnerFocus && partnerFocus.endsAt > now ? partnerFocus : null;
  const focusMinutes = mine.focusMinutes ?? 0;

  // Finished (now, or while you were away): credit it exactly once.
  useEffect(() => {
    if (myFocus && myFocus.endsAt <= now && completedFor.current !== myFocus.startedAt) {
      completedFor.current = myFocus.startedAt;
      void trackers.completeFocus();
    }
  }, [myFocus, now, trackers]);

  return (
    <TrackerCard
      emoji="🎯"
      title="Focus"
      tint="from-pink-100 to-rose-50 dark:from-pink-950/60 dark:to-rose-950/40"
      status={`${focusMinutes} / ${myGoals.focusMinutes} min`}
      partner={
        partnerName && trackers.partner?.focusMinutes ? `${partnerName} focused ${trackers.partner.focusMinutes} min today` : null
      }
    >
      <div className="flex items-center gap-4">
        <div className="relative grid size-28 shrink-0 place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx={50} cy={50} r={46} fill="rgb(255 255 255 / 0.75)" stroke="rgb(255 255 255 / 0.9)" strokeWidth={5} />
            {myFocus ? (
              <circle
                cx={50}
                cy={50}
                r={46}
                fill="none"
                stroke="#ec4899"
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - elapsedShare)}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            ) : null}
          </svg>
          <PlantArt seedId={plant} growth={myFocus ? 0.08 + elapsedShare * 0.92 : 0.05} still={still} className="relative h-24 w-20" />
        </div>

        <div className="min-w-0 flex-1">
          {myFocus ? (
            <>
              <p className="font-display text-3xl font-semibold text-pink-900 tabular-nums dark:text-pink-100">{mmss(remaining)}</p>
              <p className="text-xs text-ink-soft">{myFocus.together && partnerName ? `Focusing with ${partnerName} 💞` : "Stay with it, your plant is growing 🌱"}</p>
              <button
                type="button"
                onClick={() => void trackers.cancelFocus()}
                className="mt-2 text-xs font-semibold text-ink-faint underline-offset-2 hover:text-ink hover:underline"
              >
                Stop (your plant will rest)
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Session length">
                {LENGTHS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    role="radio"
                    aria-checked={length === minutes}
                    onClick={() => setLength(minutes)}
                    className={cx(
                      "rounded-full px-2.5 py-1 text-xs font-bold transition-colors",
                      length === minutes ? "bg-pink-500 text-white" : "bg-white/80 text-pink-800 dark:bg-white/10 dark:text-pink-100",
                    )}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => void trackers.startFocus(length)}
                className="mt-2.5 w-full rounded-full bg-linear-to-r from-pink-500 to-rose-500 px-4 py-2.5 font-semibold text-white shadow-md hover:brightness-105"
              >
                Start focusing
              </motion.button>
              <p className="mt-1.5 text-[0.7rem] text-ink-faint">{mine.focusSessions ?? 0} sessions today</p>
            </>
          )}
        </div>
      </div>

      {partnerActive && !myFocus && partnerName ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-white/85 px-3 py-2 dark:bg-white/10"
        >
          <p className="text-xs font-semibold text-ink">
            {partnerName} is focusing · {mmss(partnerActive.endsAt - now)} left
          </p>
          <button
            type="button"
            onClick={() => void trackers.startFocus(Math.max(1, Math.round((partnerActive.endsAt - now) / 60_000)), true, partnerActive.endsAt)}
            className="shrink-0 rounded-full bg-pink-500 px-3 py-1 text-xs font-bold text-white"
          >
            Join them
          </button>
        </motion.div>
      ) : null}
    </TrackerCard>
  );
}
