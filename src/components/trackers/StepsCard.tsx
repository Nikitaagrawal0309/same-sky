import { useState } from "react";
import { motion } from "framer-motion";

import type { TrackerControls } from "../../hooks/useTrackers";
import { TrackerCard } from "./TrackerCard";

/**
 * Steps, typed in from your phone's health app (a website can't read the
 * step counter itself). Reaching your goal ticks the Walk ritual.
 */
export function StepsCard({ trackers, partnerName }: { trackers: TrackerControls; partnerName: string | null }) {
  const steps = trackers.mine.steps ?? 0;
  const goal = trackers.myGoals.steps;
  const [draft, setDraft] = useState("");
  const progress = Math.min(1, steps / goal);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  function save() {
    const value = Number(draft.replace(/[^0-9]/g, ""));

    if (!Number.isFinite(value) || draft.trim() === "") return;

    void trackers.setSteps(value);
    setDraft("");
  }

  return (
    <TrackerCard
      emoji="🚶"
      title="Steps"
      tint="from-lime-100 to-emerald-50 dark:from-lime-950/60 dark:to-emerald-950/40"
      status={steps >= goal ? "Goal reached! 🎉" : `goal ${goal.toLocaleString()}`}
      partner={partnerName && trackers.partner ? `${partnerName}: ${(trackers.partner.steps ?? 0).toLocaleString()} steps` : null}
    >
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 80 80" className="size-24 shrink-0 -rotate-90" aria-hidden>
          <circle cx={40} cy={40} r={radius} fill="none" stroke="rgb(255 255 255 / 0.8)" strokeWidth={8} />
          <motion.circle
            cx={40}
            cy={40}
            r={radius}
            fill="none"
            stroke="url(#steps-ring)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={false}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ type: "spring", stiffness: 60, damping: 16 }}
          />
          <defs>
            <linearGradient id="steps-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a3e635" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        <div className="min-w-0">
          <p className="font-display text-3xl font-semibold text-emerald-900 tabular-nums dark:text-emerald-100">{steps.toLocaleString()}</p>
          <p className="text-xs text-ink-soft">{Math.round(progress * 100)}% of today's goal</p>
        </div>
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <input
          inputMode="numeric"
          aria-label="Today's steps"
          placeholder="Today's steps"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-w-0 flex-1 rounded-full border-2 border-white bg-white/90 px-4 py-2 text-ink outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-white/10"
        />
        <button type="submit" className="rounded-full bg-linear-to-r from-lime-500 to-emerald-500 px-4 font-semibold text-white shadow-md hover:brightness-105">
          Save
        </button>
      </form>
      <p className="mt-1.5 text-[0.7rem] text-ink-faint">Copy the number from your phone's health app.</p>
    </TrackerCard>
  );
}
