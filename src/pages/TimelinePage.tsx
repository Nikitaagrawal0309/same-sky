import {
  Bird,
  BookOpen,
  ClipboardList,
  History,
  Images,
  Mail,
  Sparkles,
  Star,
  TreeDeciduous,
  type LucideIcon,
} from "lucide-react";

import type { WorldEvent, WorldEventType } from "../types/world";
import { useTimeline } from "../hooks/useTimeline";
import { usePartner } from "../hooks/useWorld";
import { useProfile } from "../hooks/useAuth";
import { Card, EmptyState, SectionHeading } from "../components/ui/Card";
import { formatFullDate } from "../utils/date";
import { cx, groupBy } from "../utils/helpers";

/**
 * The historical timeline.
 *
 * A permanent record of the moments that mark a shared journey — never a
 * feed to keep up with. There is no "unread" state and nothing here expects
 * to be checked regularly; it exists to be found years later.
 */

const EVENT_ICONS: Record<WorldEventType, LucideIcon> = {
  "world-created": Sparkles,
  "ritual-honoured": Star,
  "tree-stage": TreeDeciduous,
  "wildlife-arrived": Bird,
  "note-left": Mail,
  "journal-entry": BookOpen,
  "memory-saved": Images,
  "plan-created": ClipboardList,
  "reflection-ready": Sparkles,
  milestone: Star,
};

/**
 * A quiet colour per kind of moment — not decoration for its own sake, but
 * the fastest way to tell a year's shape apart at a glance: how much of it
 * was growth, how much was kept on purpose, how much was written down.
 * Deliberately drawn from the same five accents used for ritual domains
 * elsewhere, so nothing new is introduced to the palette.
 */
const EVENT_TONES: Record<WorldEventType, "accent" | "water" | "ember" | "bloom" | "dusk"> = {
  "world-created": "ember",
  "ritual-honoured": "accent",
  "tree-stage": "accent",
  "wildlife-arrived": "water",
  "note-left": "ember",
  "journal-entry": "dusk",
  "memory-saved": "bloom",
  "plan-created": "water",
  "reflection-ready": "dusk",
  milestone: "bloom",
};

const TONE_CLASSES: Record<string, string> = {
  accent: "bg-accent-soft text-accent-strong",
  water: "bg-water-soft text-water",
  ember: "bg-ember-soft text-ember",
  bloom: "bg-bloom-soft text-bloom",
  dusk: "bg-dusk-soft text-dusk",
};

export default function TimelinePage() {
  const events = useTimeline();
  const profile = useProfile();
  const partner = usePartner();

  function nameFor(uid: string | null): string | null {
    if (uid === null) return null;
    if (uid === profile?.uid) return "You";
    if (uid === partner?.uid) return partner.displayName;
    return null;
  }

  const byYear = groupBy(events, (event) => event.date.slice(0, 4));
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="ss-container max-w-2xl py-12 motion-safe:animate-(--animate-fade-in)">
      <SectionHeading
        level={1}
        title="Timeline"
        description="The moments that have marked your shared journey so far."
      />

      <div className="mt-10">
        {events.length === 0 ? (
          <EmptyState
            icon={<History aria-hidden className="size-8" strokeWidth={1.3} />}
            title="Your timeline is just beginning"
            description="Milestones, memories and journal entries will gather here as your world grows."
          />
        ) : (
          <div className="space-y-10">
            {years.map((year) => (
              <section key={year}>
                <h2 className="text-sm font-medium tracking-wide text-ink-faint uppercase">
                  {year}
                </h2>

                {/* The connecting thread: a single line behind every marker in
                    the year, so the list reads as one continuous journey
                    rather than a stack of unrelated cards. */}
                {/* left-10 (2.5rem) lines up with the centre of each row's
                    size-10 icon circle, which sits inside Card's p-5 padding:
                    20px padding + 20px (half the icon) = 40px from the edge. */}
                <ul className="relative mt-4 space-y-3 before:absolute before:top-1 before:bottom-1 before:left-10 before:w-px before:bg-line">
                  {byYear[year].map((event) => (
                    <TimelineRow key={event.id} event={event} authorName={nameFor(event.uid)} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineRow({
  event,
  authorName,
}: {
  event: WorldEvent;
  authorName: string | null;
}) {
  const Icon = EVENT_ICONS[event.type];
  const tone = EVENT_TONES[event.type];

  return (
    <li className="relative">
      <Card padding="sm" className="flex items-start gap-4">
        <span
          className={cx(
            "relative z-10 grid size-10 shrink-0 place-items-center rounded-full",
            TONE_CLASSES[tone],
          )}
        >
          <Icon aria-hidden className="size-4.5" strokeWidth={1.5} />
        </span>

        <div className="min-w-0">
          <p className="text-[0.95rem] text-ink">{event.title}</p>

          {event.detail ? (
            <p className="mt-1 text-sm text-ink-soft">{event.detail}</p>
          ) : null}

          <p className="mt-1.5 text-xs text-ink-faint">
            {formatFullDate(event.date)}
            {authorName ? ` · ${authorName}` : ""}
          </p>
        </div>
      </Card>
    </li>
  );
}
