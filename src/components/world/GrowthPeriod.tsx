import { useState } from "react";
import { Plus, X } from "lucide-react";

import type { PlanPeriod } from "../../types/planning";
import { usePlan, useReflection } from "../../hooks/usePlanning";
import { usePartner } from "../../hooks/useWorld";
import { useUid } from "../../hooks/useAuth";
import { toMonthKey, toWeekKey } from "../../utils/date";
import { cx, firstNameOf } from "../../utils/helpers";
import { INTENTION_MAX_LENGTH, validateIntention } from "../../utils/validators";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Icon";
import { TextField } from "../ui/Field";

/**
 * Planning and reflection, together.
 *
 * A period's intentions and its reflection sit side by side on purpose: what
 * you meant to tend to and what actually happened belong in the same glance,
 * not on separate screens a person has to reconcile themselves.
 */

const TONE_CLASSES: Record<string, string> = {
  growth: "border-accent/30 bg-accent-soft",
  together: "border-bloom/30 bg-bloom-soft",
  steady: "border-water/30 bg-water-soft",
  gentle: "border-line bg-surface-sunken",
};

export function GrowthPeriod() {
  const [period, setPeriod] = useState<PlanPeriod>("week");
  const now = new Date();
  const periodKey = period === "week" ? toWeekKey(now) : toMonthKey(now);

  const { plan, add, remove } = usePlan(period, periodKey);
  const { reflection, isLoading } = useReflection(period, periodKey);

  const partner = usePartner();
  const uid = useUid();

  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function nameFor(authorUid: string): string {
    if (authorUid === uid) return "You";
    if (authorUid === partner?.uid) return firstNameOf(partner.displayName);
    return "Your person";
  }

  async function handleAdd(): Promise<void> {
    const validation = validateIntention(draft);

    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    await add(draft, null, false);
    setDraft("");
    setError(null);
  }

  const intentions = plan ? Object.values(plan.intentions) : [];

  return (
    <Card padding="md">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg text-ink">
          {period === "week" ? "This week" : "This month"}
        </h2>

        <div className="flex gap-1 rounded-full bg-surface-sunken p-1">
          {(["week", "month"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              aria-pressed={period === option}
              className={cx(
                "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors duration-200",
                period === option ? "bg-surface text-ink shadow-soft" : "text-ink-faint",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-ink-soft">What you're tending to</p>

        <ul className="mt-3 space-y-2">
          {intentions.map((intention) => (
            <li
              key={intention.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface-sunken px-4 py-2.5"
            >
              <span className="text-sm text-ink">{intention.text}</span>

              <span className="flex items-center gap-2 text-xs text-ink-faint">
                {nameFor(intention.authorUid)}

                {intention.authorUid === uid ? (
                  <button
                    type="button"
                    aria-label="Remove this intention"
                    onClick={() => void remove(intention.id)}
                    className="rounded-full p-1 hover:bg-surface hover:text-ink"
                  >
                    <X aria-hidden className="size-3.5" strokeWidth={1.8} />
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>

        <form
          className="mt-3 flex items-start gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleAdd();
          }}
        >
          <TextField
            label="Add an intention"
            hideLabel
            placeholder="Something worth tending to…"
            value={draft}
            maxLength={INTENTION_MAX_LENGTH}
            error={error}
            className="flex-1"
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
          />

          <Button type="submit" variant="quiet" size="md" icon={<Plus aria-hidden className="size-4" />}>
            Add
          </Button>
        </form>
      </div>

      <div className="mt-8 border-t border-line pt-6">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner label="Gathering this period" />
          </div>
        ) : reflection ? (
          <div className="space-y-3">
            {reflection.observations.map((observation) => (
              <div
                key={observation.id}
                className={cx("rounded-xl border p-4", TONE_CLASSES[observation.tone])}
              >
                <p className="text-[0.95rem] text-ink">{observation.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{observation.detail}</p>
              </div>
            ))}

            <p className="pt-2 text-sm text-ink-faint">{reflection.invitation}</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
