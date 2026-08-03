import { useState } from "react";

import {
  RITUAL_CATALOGUE,
  RITUAL_DOMAIN_DESCRIPTIONS,
  RITUAL_DOMAIN_LABELS,
  RITUAL_DOMAIN_ORDER,
  getRitualsByDomain,
} from "../../services/ritual";
import type { RitualId } from "../../types/ritual";
import { cx } from "../../utils/helpers";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { RitualIcon } from "../ui/Icon";

/**
 * Choosing a practice.
 *
 * Each partner curates only their own rituals — this dialog can never be
 * opened on someone else's behalf. There is no minimum: a practice of one
 * ritual is a complete and valid practice, not a partially finished one.
 */

export interface RitualPickerProps {
  open: boolean;
  onClose: () => void;
  selectedIds: RitualId[];
  onSave: (ids: RitualId[]) => Promise<void>;
}

export function RitualPicker({ open, onClose, selectedIds, onSave }: RitualPickerProps) {
  const [selection, setSelection] = useState<Set<RitualId>>(new Set(selectedIds));
  const [isSaving, setIsSaving] = useState(false);

  function toggle(id: RitualId): void {
    setSelection((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  async function handleSave(): Promise<void> {
    setIsSaving(true);

    try {
      await onSave(Array.from(selection));
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Your practice"
      description="Choose the rituals that belong to your days. Change them any time — this is yours alone to shape."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button
            loading={isSaving}
            loadingLabel="Saving…"
            disabled={selection.size === 0}
            onClick={() => void handleSave()}
          >
            Save practice
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        {RITUAL_DOMAIN_ORDER.map((domain) => (
          <section key={domain}>
            <h3 className="text-sm font-medium tracking-wide text-ink uppercase">
              {RITUAL_DOMAIN_LABELS[domain]}
            </h3>

            <p className="mt-1 text-sm text-ink-soft">
              {RITUAL_DOMAIN_DESCRIPTIONS[domain]}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {getRitualsByDomain(domain).map((ritual) => {
                const checked = selection.has(ritual.id);

                return (
                  <label
                    key={ritual.id}
                    className={cx(
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5",
                      "transition-colors duration-200 ease-(--ease-calm)",
                      checked
                        ? "border-accent/40 bg-accent-soft"
                        : "border-line hover:border-line-strong",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(ritual.id)}
                      className="sr-only"
                    />

                    <span
                      className={cx(
                        "grid size-9 shrink-0 place-items-center rounded-full",
                        checked ? "bg-surface/70 text-ink" : "bg-surface-sunken text-ink-soft",
                      )}
                    >
                      <RitualIcon name={ritual.icon} />
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-[0.95rem] text-ink">
                        {ritual.label}
                      </span>
                      {ritual.cadence === "weekly" ? (
                        <span className="block text-xs text-ink-faint">Weekly</span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="sr-only">{RITUAL_CATALOGUE.length} rituals available in total.</p>
    </Dialog>
  );
}
