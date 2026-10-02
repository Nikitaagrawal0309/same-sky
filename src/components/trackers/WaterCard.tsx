import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

import type { TrackerControls } from "../../hooks/useTrackers";
import { cx } from "../../utils/helpers";
import { TrackerCard } from "./TrackerCard";

/**
 * Water, one glass at a time. Each tap fills the next glass; reaching your
 * goal ticks the Water ritual for the day.
 */
export function WaterCard({ trackers, partnerName, still }: { trackers: TrackerControls; partnerName: string | null; still: boolean }) {
  const count = trackers.mine.water ?? 0;
  const goal = trackers.myGoals.water;
  const done = count >= goal;
  const glasses = Math.max(goal, count);

  return (
    <TrackerCard
      emoji="💧"
      title="Water"
      tint="from-sky-100 to-cyan-50 dark:from-sky-950/70 dark:to-cyan-950/40"
      status={done ? "Goal reached! 🎉" : `${goal - count} to go`}
      partner={partnerName && trackers.partner ? `${partnerName}: ${trackers.partner.water ?? 0} / ${trackers.partnerGoals?.water ?? goal} glasses` : null}
    >
      <p className="font-display text-3xl font-semibold text-sky-900 tabular-nums dark:text-sky-100">
        {count}
        <span className="text-lg text-sky-700/70 dark:text-sky-200/70"> / {goal} glasses</span>
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5" aria-hidden>
        {Array.from({ length: glasses }).map((_, index) => (
          <Glass key={index} full={index < count} extra={index >= goal} still={still} />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => void trackers.addWater(1)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-linear-to-r from-sky-500 to-cyan-500 px-4 py-2.5 font-semibold text-white shadow-md hover:brightness-105"
        >
          <Plus aria-hidden className="size-4" />
          One glass
        </motion.button>
        <button
          type="button"
          disabled={count === 0}
          onClick={() => void trackers.addWater(-1)}
          aria-label="Remove a glass"
          className="grid size-10 place-items-center rounded-full bg-white/80 text-sky-700 shadow-sm disabled:opacity-40 dark:bg-white/10 dark:text-sky-200"
        >
          <Minus aria-hidden className="size-4" />
        </button>
      </div>
    </TrackerCard>
  );
}

function Glass({ full, extra, still }: { full: boolean; extra: boolean; still: boolean }) {
  return (
    <svg viewBox="0 0 24 30" className={cx("h-9 w-7", extra && "opacity-80")}>
      <defs>
        <clipPath id="glass-shape">
          <path d="M3,3 L21,3 L18.5,27 Q18.3,28.5 16.8,28.5 L7.2,28.5 Q5.7,28.5 5.5,27 Z" />
        </clipPath>
      </defs>
      <path d="M3,3 L21,3 L18.5,27 Q18.3,28.5 16.8,28.5 L7.2,28.5 Q5.7,28.5 5.5,27 Z" fill="rgb(255 255 255 / 0.7)" />
      <g clipPath="url(#glass-shape)">
        <motion.g initial={false} animate={{ y: full ? 0 : 26 }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
          <path d="M0,8 Q6,5 12,8 T24,8 L24,30 L0,30 Z" fill="#38bdf8" className={still ? undefined : "motion-safe:animate-(--animate-drift)"} />
          <path d="M0,10 Q6,7 12,10 T24,10" stroke="#e0f7ff" strokeWidth={1} fill="none" opacity={0.7} />
        </motion.g>
      </g>
      <path d="M3,3 L21,3 L18.5,27 Q18.3,28.5 16.8,28.5 L7.2,28.5 Q5.7,28.5 5.5,27 Z" fill="none" stroke="#0284c7" strokeWidth={1.2} />
      <path d="M6,6 L7.5,24" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
    </svg>
  );
}
