import { AnimatePresence, motion } from "framer-motion";
import { TreeDeciduous, X } from "lucide-react";

import type { TreeStage } from "../../types/world";

/**
 * A tree stage, just crossed.
 *
 * The tree is meant to be "one of the strongest emotional symbols" in the
 * product, so the one moment it visibly changes gets the one genuinely
 * celebratory touch in the whole interface — brief, quiet, and easy to
 * dismiss, never a modal standing between someone and their world.
 */
export interface MilestoneToastProps {
  stage: TreeStage | null;
  onDismiss: () => void;
}

export function MilestoneToast({ stage, onDismiss }: MilestoneToastProps) {
  return (
    <AnimatePresence>
      {stage ? (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-sm items-start gap-4 rounded-2xl border border-accent/30 bg-surface p-5 shadow-floating sm:right-6 sm:bottom-6 sm:left-auto"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
            <TreeDeciduous aria-hidden className="size-5" strokeWidth={1.6} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[0.95rem] text-ink">Your tree has grown</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              {stage.label} — {stage.meaning}
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="-mt-1 -mr-1 shrink-0 rounded-full p-1.5 text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <X aria-hidden className="size-4" strokeWidth={1.6} />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
