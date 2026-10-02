import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

import type { RitualStatus } from "../../types/ritual";
import { playChime } from "../../services/audio";
import { usePrefersStillness } from "../../hooks/useTheme";
import { cx } from "../../utils/helpers";
import { RitualIcon } from "../ui/Icon";

/**
 * One ritual, today.
 *
 * Honouring a ritual is the single most frequent action in the product, so it
 * has to feel unmistakably good without shading into a game mechanic — no
 * points appear, nothing counts up. The feedback is small and immediate: the
 * card settles into its honoured state, a brief sparkle rises past the
 * checkmark, and a soft chime plays — the specification's "small visual and
 * audio response" for a meaningful action, kept genuinely small.
 *
 * Pressing an already-honoured ritual releases it, for the person who tapped
 * by accident. There is deliberately no separate undo control: the same
 * gesture that does a thing is what undoes it.
 */

const ACCENT_CLASSES = {
  accent: "border-emerald-300/70 bg-linear-to-br from-emerald-100 to-lime-100 dark:from-emerald-900/60 dark:to-lime-900/40",
  water: "border-sky-300/70 bg-linear-to-br from-sky-100 to-cyan-100 dark:from-sky-900/60 dark:to-cyan-900/40",
  ember: "border-amber-300/70 bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-900/60 dark:to-orange-900/40",
  bloom: "border-pink-300/70 bg-linear-to-br from-pink-100 to-rose-100 dark:from-pink-900/60 dark:to-rose-900/40",
  dusk: "border-violet-300/70 bg-linear-to-br from-violet-100 to-indigo-100 dark:from-violet-900/60 dark:to-indigo-900/40",
} as const;

/** The round icon chip, coloured per ritual so the list reads at a glance. */
const ICON_CLASSES = {
  accent: "bg-linear-to-br from-emerald-300 to-lime-300 text-emerald-900",
  water: "bg-linear-to-br from-sky-300 to-cyan-300 text-sky-900",
  ember: "bg-linear-to-br from-amber-300 to-orange-300 text-amber-900",
  bloom: "bg-linear-to-br from-pink-300 to-rose-300 text-pink-900",
  dusk: "bg-linear-to-br from-violet-300 to-indigo-300 text-violet-900",
} as const;

export interface RitualCardProps {
  status: RitualStatus;
  onHonour: () => Promise<boolean>;
  onRelease: () => Promise<void>;
  /** The partner's first name, used only in the "they honoured this too" hint. */
  partnerName?: string;
}

export function RitualCard({ status, onHonour, onRelease, partnerName }: RitualCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const prefersStillness = usePrefersStillness();
  const { definition, honouredBySelf, honouredByPartner } = status;

  async function handlePress(): Promise<void> {
    if (isPending) return;

    setIsPending(true);

    try {
      if (honouredBySelf) {
        playChime("ritual-released");
        await onRelease();
        return;
      }

      const created = await onHonour();

      if (created) {
        playChime("ritual-honoured");
        setCelebrating(true);
        window.setTimeout(() => setCelebrating(false), 900);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={() => void handlePress()}
      disabled={isPending}
      aria-pressed={honouredBySelf}
      whileTap={prefersStillness ? undefined : { scale: 0.97 }}
      whileHover={prefersStillness ? undefined : { y: -3 }}
      className={cx(
        "relative flex w-full items-center gap-4 overflow-hidden rounded-3xl border-2 p-4 text-left",
        "shadow-soft transition-[background-color,border-color,box-shadow] duration-300 ease-(--ease-calm) hover:shadow-lifted",
        "disabled:pointer-events-none",
        honouredBySelf
          ? ACCENT_CLASSES[definition.accent]
          : "border-white/80 bg-white/80 backdrop-blur-sm hover:border-white dark:border-white/10 dark:bg-white/5",
      )}
    >
      <span
        className={cx(
          "grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm transition-transform duration-300",
          ICON_CLASSES[definition.accent],
          honouredBySelf && "rotate-6 scale-105",
        )}
      >
        <RitualIcon name={definition.icon} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[1.05rem] font-medium text-ink">{definition.label}</span>

        <span className="block truncate text-sm text-ink-soft">
          {honouredByPartner && !honouredBySelf && partnerName
            ? `${partnerName} already has today.`
            : definition.description}
        </span>
      </span>

      <span
        aria-hidden
        className={cx(
          "grid size-7 shrink-0 place-items-center rounded-full border transition-colors duration-300",
          honouredBySelf
            ? "border-transparent bg-emerald-500 text-white shadow-md"
            : "border-line-strong bg-white/60 text-transparent dark:bg-transparent",
        )}
      >
        <Check className="size-4" strokeWidth={2.5} />
      </span>

      {honouredByPartner ? (
        <span className="sr-only">
          {partnerName ? `${partnerName} has also honoured this today.` : "Your partner has also honoured this today."}
        </span>
      ) : null}

      <AnimatePresence>
        {celebrating && !prefersStillness ? (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute top-3 right-3 text-amber-400"
            initial={{ opacity: 0, y: 6, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -18, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <Sparkles className="size-5" strokeWidth={1.6} />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}
