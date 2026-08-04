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
  accent: "border-accent/40 bg-accent-soft",
  water: "border-water/40 bg-water-soft",
  ember: "border-ember/40 bg-ember-soft",
  bloom: "border-bloom/40 bg-bloom-soft",
  dusk: "border-dusk/40 bg-dusk-soft",
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
      whileTap={prefersStillness ? undefined : { scale: 0.985 }}
      className={cx(
        "relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left",
        "transition-colors duration-300 ease-(--ease-calm)",
        "disabled:pointer-events-none",
        honouredBySelf
          ? ACCENT_CLASSES[definition.accent]
          : "border-line bg-surface hover:border-line-strong hover:bg-surface-sunken",
      )}
    >
      <span
        className={cx(
          "grid size-11 shrink-0 place-items-center rounded-full",
          honouredBySelf ? "bg-surface/70 text-ink" : "bg-surface-sunken text-ink-soft",
        )}
      >
        <RitualIcon name={definition.icon} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{definition.label}</span>

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
            ? "border-transparent bg-ink text-canvas"
            : "border-line-strong text-transparent",
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
            className="pointer-events-none absolute top-3 right-3 text-accent"
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
