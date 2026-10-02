import { motion } from "framer-motion";
import { Lock } from "lucide-react";

import { badgeRequirementText, badgeUnlockText, type BadgeStatus } from "../../services/badges";
import type { BadgeKind } from "../../types/garden";
import { formatDayAndMonth } from "../../utils/date";
import { cx } from "../../utils/helpers";

const KIND_STYLES: Record<BadgeKind, { medal: string; ribbon: string; label: string }> = {
  weather: { medal: "from-sky-300 via-cyan-200 to-amber-200", ribbon: "#38bdf8", label: "Weather" },
  plant: { medal: "from-lime-300 via-emerald-200 to-lime-100", ribbon: "#22c55e", label: "Plant" },
  bush: { medal: "from-rose-300 via-pink-200 to-rose-100", ribbon: "#f43f5e", label: "Bush" },
  tree: { medal: "from-pink-200 via-rose-100 to-lime-200", ribbon: "#ec4899", label: "Tree" },
  "fruit-tree": { medal: "from-orange-300 via-amber-200 to-yellow-100", ribbon: "#f97316", label: "Fruit tree" },
};

/** A round medal with a ribbon. Greyed and locked until earned. */
export function BadgeMedal({ status, index = 0, compact = false }: { status: BadgeStatus; index?: number; compact?: boolean }) {
  const styles = KIND_STYLES[status.badge.kind];
  const size = compact ? "size-16" : "size-16 sm:size-20";

  return (
    <motion.div
      className="flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 14, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      title={`${status.badge.name}: ${badgeRequirementText(status)}. ${badgeUnlockText(status)}.`}
    >
      <div className="relative">
        {/* Ribbon tails */}
        <svg viewBox="0 0 40 30" className={cx("absolute top-[70%] left-1/2 -translate-x-1/2", compact ? "w-10" : "w-12")} aria-hidden>
          <path d="M8,0 L4,28 L12,22 L16,30 L18,0 Z" fill={status.unlocked ? styles.ribbon : "#cbd5e1"} />
          <path d="M22,0 L24,30 L28,22 L36,28 L32,0 Z" fill={status.unlocked ? styles.ribbon : "#cbd5e1"} opacity={0.85} />
        </svg>

        <motion.div
          whileHover={status.unlocked ? { rotate: [0, -8, 8, 0], scale: 1.08 } : undefined}
          transition={{ duration: 0.5 }}
          className={cx(
            "relative grid place-items-center rounded-full border-4 border-white bg-linear-to-br shadow-lifted dark:border-white/20",
            size,
            status.unlocked ? styles.medal : "from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800",
          )}
        >
          <span className={cx(compact ? "text-3xl" : "text-3xl sm:text-4xl", !status.unlocked && "opacity-30 grayscale")}>{status.badge.emoji}</span>
          {!status.unlocked ? (
            <span className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full bg-white text-slate-500 shadow dark:bg-slate-900">
              <Lock aria-hidden className="size-3.5" />
            </span>
          ) : (
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-tr from-transparent via-white/50 to-transparent opacity-70" />
          )}
        </motion.div>
      </div>

      <p className={cx("mt-4 font-display leading-tight font-semibold text-ink", compact ? "text-sm" : "text-sm sm:text-base")}>{status.badge.name}</p>
      <p className="mt-0.5 text-[0.62rem] font-bold tracking-wide text-ink-faint uppercase sm:text-[0.7rem]">{styles.label}</p>

      {status.unlocked ? (
        <p className="mt-1 text-[0.68rem] text-emerald-700 sm:text-xs dark:text-emerald-300">
          Earned {status.unlockedOn ? formatDayAndMonth(status.unlockedOn) : ""}
        </p>
      ) : (
        <div className="mt-1.5 w-full max-w-28">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-400 to-pink-500"
              style={{ width: `${(status.current / status.badge.count) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-[0.7rem] text-ink-faint">
            {status.current} / {badgeRequirementText(status)}
          </p>
        </div>
      )}
    </motion.div>
  );
}
