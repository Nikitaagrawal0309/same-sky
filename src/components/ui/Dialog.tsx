import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { cx } from "../../utils/helpers";

/**
 * A modal panel.
 *
 * Handles the four things a hand-rolled modal almost always gets wrong:
 * focus moves into the panel on open and returns to the trigger on close,
 * Tab is contained, Escape dismisses, and the page behind cannot scroll.
 */

const SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;

export interface DialogProps {
  open: boolean;
  onClose: () => void;

  title: string;

  /** A supporting line, announced with the title. */
  description?: string;

  children: React.ReactNode;

  /** Actions, aligned to the end of the panel. */
  footer?: React.ReactNode;

  size?: keyof typeof SIZES;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = `${titleId}-description`;

  useEffect(() => {
    if (!open) return;

    returnFocusTo.current = document.activeElement as HTMLElement | null;

    // Move focus into the panel rather than leaving it behind the scrim.
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? panelRef.current)?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Wrap at both ends so Tab can never reach the page behind the panel.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
      returnFocusTo.current?.focus();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            className="absolute inset-0 bg-(--ss-scrim) backdrop-blur-[2px]"
            aria-hidden
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className={cx(
              "relative flex max-h-[92svh] w-full flex-col overflow-hidden",
              "rounded-t-3xl bg-surface shadow-floating sm:rounded-3xl",
              SIZES[size],
            )}
          >
            <header className="flex items-start justify-between gap-6 px-6 pt-6 sm:px-8 sm:pt-8">
              <div className="min-w-0">
                <h2 id={titleId} className="text-2xl text-ink">
                  {title}
                </h2>

                {description ? (
                  <p
                    id={descriptionId}
                    className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft"
                  >
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 -mt-1 rounded-full p-2 text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <X aria-hidden className="size-5" strokeWidth={1.5} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
              {children}
            </div>

            {footer ? (
              <footer className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-5 sm:px-8">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
