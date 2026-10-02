import { useState } from "react";
import { motion } from "framer-motion";

import { useMeasureHistory, useTrackers } from "../../hooks/useTrackers";
import { useUid } from "../../hooks/useAuth";
import type { DailyMeasures } from "../../types/trackers";
import { addDaysToKey, formatWeekdayShort } from "../../utils/date";
import { useWorldStore } from "../../store/worldStore";
import { cx } from "../../utils/helpers";
import { NaturePanel } from "../ui/NaturePanel";

/**
 * The last seven days of your daily trackers, as small charts: water,
 * steps, focus minutes, and wake/bed times against your targets. Switch to
 * your person's to see their week. A soft line marks the goal; nothing
 * turns red for missing it.
 */
export function RhythmsPanel({ partnerName }: { partnerName: string | null }) {
  const uid = useUid();
  const today = useWorldStore((state) => state.today);
  const trackers = useTrackers();
  const history = useMeasureHistory(7);
  const [who, setWho] = useState<"me" | "partner">("me");

  const viewUid = who === "me" ? uid : trackers.partnerUid;
  const goals = who === "me" ? trackers.myGoals : (trackers.partnerGoals ?? trackers.myGoals);
  const days = Array.from({ length: 7 }, (_, index) => addDaysToKey(today, index - 6));
  const value = (date: string): DailyMeasures => (viewUid ? (history[date]?.[viewUid] ?? {}) : {});

  return (
    <NaturePanel
      theme="lake"
      eyebrow="your week, gently"
      title="Daily rhythms"
      description="Water, steps, focus and sleep over the last seven days."
      action={
        partnerName && trackers.partnerUid ? (
          <div className="flex rounded-full bg-white/70 p-1 shadow-soft dark:bg-white/10" role="tablist">
            {(["me", "partner"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={who === option}
                onClick={() => setWho(option)}
                className={cx(
                  "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  who === option ? "bg-sky-500 text-white" : "text-sky-800 dark:text-sky-100",
                )}
              >
                {option === "me" ? "You" : partnerName}
              </button>
            ))}
          </div>
        ) : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniBars title="💧 Water" unit="glasses" goal={goals.water} colour="#38bdf8" days={days} values={days.map((day) => value(day).water ?? 0)} />
        <MiniBars title="🚶 Steps" unit="steps" goal={goals.steps} colour="#22c55e" days={days} values={days.map((day) => value(day).steps ?? 0)} />
        <MiniBars title="🎯 Focus" unit="min" goal={goals.focusMinutes} colour="#ec4899" days={days} values={days.map((day) => value(day).focusMinutes ?? 0)} />
        <SleepDots days={days} wake={days.map((day) => value(day).wakeTime ?? null)} sleep={days.map((day) => value(day).sleepTime ?? null)} wakeGoal={goals.wakeTime} sleepGoal={goals.sleepTime} />
      </div>
    </NaturePanel>
  );
}

function MiniBars({ title, unit, goal, colour, days, values }: { title: string; unit: string; goal: number; colour: string; days: string[]; values: number[] }) {
  const max = Math.max(goal * 1.15, ...values, 1);
  const goalAt = (goal / max) * 100;
  const average = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);

  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-soft dark:bg-white/5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-ink">{title}</h3>
        <span className="text-xs text-ink-faint">
          avg {average.toLocaleString()} {unit}
        </span>
      </div>
      <div className="relative mt-3 flex h-28 items-end gap-1.5">
        <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-ink-faint/40" style={{ bottom: `${goalAt}%` }}>
          <span className="absolute -top-4 right-0 text-[0.62rem] font-semibold text-ink-faint">goal</span>
        </div>
        {values.map((v, index) => (
          <div key={days[index]} className="group relative flex h-full flex-1 flex-col justify-end" tabIndex={0}>
            <span className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 rounded-md bg-slate-900 px-1.5 py-0.5 text-[0.65rem] font-semibold whitespace-nowrap text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
              {v.toLocaleString()}
            </span>
            <motion.div
              className="w-full rounded-t-[4px]"
              style={{ background: v > 0 ? `linear-gradient(to top, ${colour}, ${colour}aa)` : "var(--ss-border)" }}
              initial={{ height: 0 }}
              animate={{ height: `${v > 0 ? Math.max(5, (v / max) * 100) : 3}%` }}
              transition={{ duration: 0.6, delay: index * 0.04 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {days.map((day) => (
          <span key={day} className="flex-1 text-center text-[0.65rem] text-ink-faint">
            {formatWeekdayShort(day).slice(0, 2)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Wake (sun) and bed (moon) times each day, against a soft band around your targets. */
function SleepDots({ days, wake, sleep, wakeGoal, sleepGoal }: { days: string[]; wake: (string | null)[]; sleep: (string | null)[]; wakeGoal: string; sleepGoal: string }) {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  // Two lanes: mornings (4:00–12:00) and evenings (19:00–03:00, wrapped).
  const morning = (time: string) => Math.min(1, Math.max(0, (toMinutes(time) - 240) / 480));
  const evening = (time: string) => {
    let minutes = toMinutes(time);
    if (minutes < 720) minutes += 1440;
    return Math.min(1, Math.max(0, (minutes - 1140) / 480));
  };

  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-soft dark:bg-white/5">
      <h3 className="font-semibold text-ink">🌅 Wake & 🌙 bed</h3>
      <div className="mt-3 space-y-3">
        {[
          { label: "Up", times: wake, place: morning, goal: wakeGoal, icon: "☀️" },
          { label: "Bed", times: sleep, place: evening, goal: sleepGoal, icon: "🌙" },
        ].map((lane) => (
          <div key={lane.label} className="relative h-10 rounded-full bg-sky-50 dark:bg-white/5">
            <div className="absolute inset-y-1 rounded-full bg-emerald-200/70 dark:bg-emerald-800/40" style={{ left: `calc(${lane.place(lane.goal) * 100}% - 6%)`, width: "12%" }} />
            <span className="absolute top-1/2 left-2 -translate-y-1/2 text-[0.65rem] font-bold text-ink-faint">{lane.label}</span>
            {lane.times.map((time, index) =>
              time ? (
                <span
                  key={days[index]}
                  title={`${formatWeekdayShort(days[index])} ${time}`}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-base"
                  style={{ left: `${lane.place(time) * 100}%` }}
                >
                  {lane.icon}
                </span>
              ) : null,
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[0.7rem] text-ink-faint">Green band: within 30 minutes of your target time.</p>
    </div>
  );
}
