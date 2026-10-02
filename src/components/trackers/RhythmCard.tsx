import { motion } from "framer-motion";
import { Undo2 } from "lucide-react";

import type { TrackerControls } from "../../hooks/useTrackers";
import { ON_TIME_WINDOW_MINUTES } from "../../types/trackers";
import { TrackerCard } from "./TrackerCard";

/** Minutes between two "HH:MM" clock times, the short way round midnight. */
function minutesApart(a: string, b: string): number {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  const diff = Math.abs(toMinutes(a) - toMinutes(b));
  return Math.min(diff, 1440 - diff);
}

/** "7:00 AM" or "07:00", whichever the viewer's clock uses. */
function friendly(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function verdict(actual: string, target: string): string {
  return minutesApart(actual, target) <= ON_TIME_WINDOW_MINUTES ? "right on time 🌟" : "still counts 💛";
}

/**
 * Wake-up and bedtime, against targets you choose (and can change any day).
 * Checking in ticks the Wake up / Sleep ritual; being near your target is
 * celebrated, being off it is never scolded.
 */
export function RhythmCard({ trackers, partnerName }: { trackers: TrackerControls; partnerName: string | null }) {
  const { mine, myGoals, partner } = trackers;

  const partnerLine =
    partnerName && partner && (partner.wakeTime || partner.sleepTime)
      ? `${partnerName}${partner.wakeTime ? ` woke at ${friendly(partner.wakeTime)}` : ""}${partner.wakeTime && partner.sleepTime ? " ·" : ""}${partner.sleepTime ? ` bed at ${friendly(partner.sleepTime)}` : ""}`
      : null;

  return (
    <TrackerCard
      emoji="🌅"
      title="Wake & bed"
      tint="from-amber-100 to-indigo-50 dark:from-amber-950/60 dark:to-indigo-950/50"
      status={`${friendly(myGoals.wakeTime)} – ${friendly(myGoals.sleepTime)}`}
      partner={partnerLine}
    >
      <div className="grid grid-cols-2 gap-2">
        <CheckIn
          label="I'm up"
          emoji="☀️"
          done={mine.wakeTime ?? null}
          target={myGoals.wakeTime}
          onCheckIn={() => void trackers.checkInWake()}
          onUndo={() => void trackers.undoWake()}
          tone="from-amber-400 to-orange-400"
        />
        <CheckIn
          label="Going to bed"
          emoji="🌙"
          done={mine.sleepTime ?? null}
          target={myGoals.sleepTime}
          onCheckIn={() => void trackers.checkInSleep()}
          onUndo={() => void trackers.undoSleep()}
          tone="from-indigo-400 to-sky-500"
        />
      </div>
    </TrackerCard>
  );
}

function CheckIn({
  label,
  emoji,
  done,
  target,
  onCheckIn,
  onUndo,
  tone,
}: {
  label: string;
  emoji: string;
  done: string | null;
  target: string;
  onCheckIn: () => void;
  onUndo: () => void;
  tone: string;
}) {
  if (done) {
    return (
      <div className="relative rounded-2xl bg-white/85 p-3 text-center shadow-sm dark:bg-white/10">
        <p className="text-2xl" aria-hidden>{emoji}</p>
        <p className="font-display text-lg font-semibold text-ink tabular-nums">{friendly(done)}</p>
        <p className="text-xs font-semibold text-ink-soft">{verdict(done, target)}</p>
        <button
          type="button"
          onClick={onUndo}
          aria-label={`Undo ${label}`}
          className="absolute top-1.5 right-1.5 rounded-full p-1 text-ink-faint hover:bg-black/5 hover:text-ink"
        >
          <Undo2 aria-hidden className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -2 }}
      onClick={onCheckIn}
      className={`rounded-2xl bg-linear-to-br ${tone} p-3 text-center font-semibold text-white shadow-md`}
    >
      <span className="block text-2xl" aria-hidden>{emoji}</span>
      {label}
      <span className="block text-xs font-medium text-white/85">aim {friendly(target)}</span>
    </motion.button>
  );
}
