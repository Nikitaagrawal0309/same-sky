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
import { groupBy } from "../utils/helpers";

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
    <div className="ss-container max-w-2xl py-12">
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

                <ul className="mt-4 space-y-3">
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

  return (
    <li>
      <Card padding="sm" className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-sunken text-ink-soft">
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
