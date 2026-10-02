import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { useTrackers } from "../../hooks/useTrackers";
import { usePrefersStillness } from "../../hooks/useTheme";
import type { TrackerGoals } from "../../types/trackers";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { NaturePanel } from "../ui/NaturePanel";
import { FocusCard } from "./FocusCard";
import { RhythmCard } from "./RhythmCard";
import { StepsCard } from "./StepsCard";
import { WaterCard } from "./WaterCard";

/**
 * The daily trackers: water, wake and bed, steps and focus, side by side
 * with how your person's day is going. Goals are yours to change any time.
 */
export function TrackersPanel({ partnerName }: { partnerName: string | null }) {
  const trackers = useTrackers();
  const still = usePrefersStillness();
  const [editing, setEditing] = useState(false);

  return (
    <NaturePanel
      theme="meadow"
      eyebrow="little numbers, big love"
      title="Daily trackers"
      description="Every glass, step and focused minute counts toward your world, and your person can cheer you on."
      action={
        <Button variant="quiet" size="sm" icon={<SlidersHorizontal aria-hidden className="size-4" />} onClick={() => setEditing(true)}>
          Your goals
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <WaterCard trackers={trackers} partnerName={partnerName} still={still} />
        <RhythmCard trackers={trackers} partnerName={partnerName} />
        <StepsCard trackers={trackers} partnerName={partnerName} />
        <FocusCard trackers={trackers} partnerName={partnerName} still={still} />
      </div>

      {editing ? (
        <GoalsDialog goals={trackers.myGoals} onClose={() => setEditing(false)} onSave={trackers.saveGoals} />
      ) : null}
    </NaturePanel>
  );
}

function GoalsDialog({
  goals,
  onClose,
  onSave,
}: {
  goals: TrackerGoals;
  onClose: () => void;
  onSave: (changes: Partial<TrackerGoals>) => Promise<void>;
}) {
  const [draft, setDraft] = useState(goals);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof TrackerGoals>(key: K, value: TrackerGoals[K]) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <Dialog
      open
      onClose={onClose}
      title="Your daily goals"
      description="Change them whenever life changes. Only you can set yours."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={saving}
            loadingLabel="Saving…"
            onClick={async () => {
              setSaving(true);
              await onSave(draft);
              setSaving(false);
              onClose();
            }}
          >
            Save goals
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Range label="💧 Water" value={draft.water} min={3} max={15} step={1} unit="glasses" onChange={(value) => set("water", value)} />
        <Range label="🚶 Steps" value={draft.steps} min={2000} max={15000} step={500} unit="steps" onChange={(value) => set("steps", value)} />

        <div className="grid grid-cols-2 gap-4">
          <TimeField label="☀️ Wake up at" value={draft.wakeTime} onChange={(value) => set("wakeTime", value)} />
          <TimeField label="🌙 Bed at" value={draft.sleepTime} onChange={(value) => set("sleepTime", value)} />
        </div>

        <Range label="🎯 Focus each day" value={draft.focusMinutes} min={15} max={240} step={15} unit="minutes" onChange={(value) => set("focusMinutes", value)} />
        <Range label="⏱️ One focus session" value={draft.sessionMinutes} min={10} max={90} step={5} unit="minutes" onChange={(value) => set("sessionMinutes", value)} />
      </div>
    </Dialog>
  );
}

function Range({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm font-semibold text-ink">
        {label}
        <span className="font-display text-lg text-ink">
          {value.toLocaleString()} <span className="text-sm text-ink-soft">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-emerald-500"
      />
    </label>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(event) => event.target.value && onChange(event.target.value)}
        className="mt-1.5 w-full rounded-2xl border-2 border-line bg-surface px-3 py-2 text-ink outline-none focus:border-emerald-400"
      />
    </label>
  );
}
