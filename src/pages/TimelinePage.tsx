import { motion } from "framer-motion";
import {
  Award,
  Bird,
  BookOpen,
  ClipboardList,
  Images,
  Mail,
  Sparkles,
  Star,
  TreeDeciduous,
  type LucideIcon,
} from "lucide-react";

import type { WorldEvent, WorldEventType } from "../types/world";
import type { BadgeStatus } from "../services/badges";
import { badgeUnlockText } from "../services/badges";
import { useBadges } from "../hooks/useGarden";
import { useTimeline } from "../hooks/useTimeline";
import { useHasPartner, usePartner } from "../hooks/useWorld";
import { useProfile } from "../hooks/useAuth";
import { BadgeMedal } from "../components/garden/BadgeMedal";
import { NaturePanel } from "../components/ui/NaturePanel";
import { CONSISTENT_MONTH_DAYS, CONSISTENT_WEEK_DAYS } from "../types/garden";
import { formatFullDate } from "../utils/date";
import { cx, groupBy } from "../utils/helpers";

/**
 * The historical timeline.
 *
 * A permanent record of the moments that mark a shared journey — never a
 * feed to keep up with. Badges earned for staying consistent appear here
 * too, alongside milestones, memories and journal pages, and each one
 * unlocks a new seed or weather for the garden on Growth.
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

const EVENT_TONES: Record<WorldEventType, string> = {
  "world-created": "bg-amber-200 text-amber-800",
  "ritual-honoured": "bg-emerald-200 text-emerald-800",
  "tree-stage": "bg-lime-200 text-lime-800",
  "wildlife-arrived": "bg-sky-200 text-sky-800",
  "note-left": "bg-orange-200 text-orange-800",
  "journal-entry": "bg-rose-200 text-rose-800",
  "memory-saved": "bg-pink-200 text-pink-800",
  "plan-created": "bg-cyan-200 text-cyan-800",
  "reflection-ready": "bg-teal-200 text-teal-800",
  milestone: "bg-yellow-200 text-yellow-800",
};

/** What the timeline collects, shown as a guide before (and above) it fills up. */
const GATHERS = [
  { icon: TreeDeciduous, tone: "bg-lime-200 text-lime-800", title: "Milestones", text: "Your tree reaching a new stage, wildlife moving in, the day your world began." },
  { icon: Award, tone: "bg-amber-200 text-amber-800", title: "Badges", text: "Earned for consistent weeks and months, alone and together. Each unlocks a seed or weather." },
  { icon: Images, tone: "bg-pink-200 text-pink-800", title: "Memories", text: "Every photo and moment you save on the Memories page." },
  { icon: BookOpen, tone: "bg-rose-200 text-rose-800", title: "Journal pages", text: "Each page either of you writes in the co-journal." },
  { icon: Mail, tone: "bg-orange-200 text-orange-800", title: "Notes", text: "The little notes you leave each other in the world." },
] as const;

type TimelineItem =
  | { kind: "event"; key: string; date: string; event: WorldEvent }
  | { kind: "badge"; key: string; date: string; status: BadgeStatus };

export default function TimelinePage() {
  const events = useTimeline();
  const profile = useProfile();
  const partner = usePartner();
  const hasPartner = useHasPartner();
  const { badges, counts } = useBadges();

  function nameFor(uid: string | null): string | null {
    if (uid === null) return null;
    if (uid === profile?.uid) return "You";
    if (uid === partner?.uid) return partner.displayName;
    return null;
  }

  const items: TimelineItem[] = [
    ...events.map((event) => ({ kind: "event" as const, key: event.id, date: event.date, event })),
    ...badges
      .filter((status) => status.unlocked && status.unlockedOn)
      .map((status) => ({ kind: "badge" as const, key: `badge-${status.badge.id}`, date: status.unlockedOn!, status })),
  ].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));

  const byYear = groupBy(items, (item) => item.date.slice(0, 4));
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));
  const earned = badges.filter((status) => status.unlocked).length;

  return (
    <div className="ss-container max-w-4xl space-y-6 py-8 sm:space-y-8 sm:py-12 motion-safe:animate-(--animate-fade-in)">
      <header>
        <p className="ss-hand text-2xl text-amber-600 dark:text-amber-300">every step, kept</p>
        <h1 className="ss-gradient-text font-display text-5xl font-bold sm:text-6xl">Timeline</h1>
        <p className="mt-2 max-w-prose text-[0.95rem] text-ink-soft">
          The moments that mark your journey, and the badges you earn by showing up.
        </p>
      </header>

      <NaturePanel
        theme="sunset"
        eyebrow={`${earned} of ${badges.length} earned`}
        title="Your badges"
        description={`A week counts when you show up on ${CONSISTENT_WEEK_DAYS} of its 7 days; a month counts at ${CONSISTENT_MONTH_DAYS} days. Every badge unlocks something new for your garden.`}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Counter label="Your consistent weeks" value={counts.soloWeeks} tone="from-amber-200 to-yellow-100" />
          <Counter label="Weeks you were both consistent" value={counts.togetherWeeks} tone="from-pink-200 to-rose-100" />
          <Counter label="Your consistent months" value={counts.soloMonths} tone="from-lime-200 to-emerald-100" />
          <Counter label="Months you were both consistent" value={counts.togetherMonths} tone="from-sky-200 to-cyan-100" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-x-2 gap-y-6 rounded-3xl bg-white/70 px-2 py-5 shadow-soft sm:mt-6 sm:gap-x-4 sm:gap-y-8 sm:p-6 lg:grid-cols-4 dark:bg-white/5">
          {badges.map((status, index) => (
            <BadgeMedal key={status.badge.id} status={status} index={index} />
          ))}
        </div>

        {!hasPartner ? (
          <p className="mt-3 text-sm text-ink-soft">
            Badges for being consistent together will start counting the day your person joins.
          </p>
        ) : null}
      </NaturePanel>

      <NaturePanel theme="lake" eyebrow="what collects here" title="Where everything gathers">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {GATHERS.map(({ icon: Icon, tone, title, text }, index) => (
            <motion.div
              key={title}
              className="rounded-3xl bg-white/80 p-4 shadow-soft dark:bg-white/5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <span className={cx("grid size-10 place-items-center rounded-2xl", tone)}>
                <Icon aria-hidden className="size-5" strokeWidth={1.8} />
              </span>
              <p className="mt-2 font-display font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-sm leading-snug text-ink-soft">{text}</p>
            </motion.div>
          ))}
        </div>
      </NaturePanel>

      <NaturePanel theme="meadow" eyebrow="your journey so far" title="The story">
        {items.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-emerald-300 bg-white/60 p-8 text-center dark:border-emerald-800 dark:bg-white/5">
            <p className="ss-hand text-3xl text-emerald-600 dark:text-emerald-300">page one, waiting</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
              Your first badge, memory or journal page will appear here. Honour a ritual five days this
              week and your first badge, Sunshine, is yours.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {years.map((year) => (
              <section key={year}>
                <h2 className="font-display text-2xl font-semibold text-emerald-900 dark:text-emerald-100">{year}</h2>

                {/* One continuous thread behind every marker in the year. */}
                <ul className="relative mt-4 space-y-3 before:absolute before:top-2 before:bottom-2 before:left-9 before:w-1 before:rounded-full before:bg-linear-to-b before:from-amber-300 before:via-pink-300 before:to-emerald-300">
                  {byYear[year].map((item, index) => (
                    <motion.li
                      key={item.key}
                      className="relative"
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.4, delay: Math.min(index, 5) * 0.04 }}
                    >
                      {item.kind === "event" ? (
                        <EventRow event={item.event} authorName={nameFor(item.event.uid)} />
                      ) : (
                        <BadgeRow status={item.status} />
                      )}
                    </motion.li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </NaturePanel>
    </div>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={cx("rounded-3xl border-2 border-white/70 bg-linear-to-br p-4 shadow-soft dark:border-white/10 dark:from-white/10 dark:to-white/5", tone)}>
      <p className="font-display text-3xl font-bold text-ink tabular-nums">{value}</p>
      <p className="text-xs font-semibold text-ink-soft">{label}</p>
    </div>
  );
}

function EventRow({ event, authorName }: { event: WorldEvent; authorName: string | null }) {
  const Icon = EVENT_ICONS[event.type];

  return (
    <div className="flex items-start gap-4 rounded-3xl bg-white/85 p-4 shadow-soft dark:bg-white/5">
      <span className={cx("relative z-10 grid size-10 shrink-0 place-items-center rounded-full ring-4 ring-white dark:ring-slate-900", EVENT_TONES[event.type])}>
        <Icon aria-hidden className="size-4.5" strokeWidth={1.8} />
      </span>

      <div className="min-w-0">
        <p className="font-display text-[1.05rem] font-medium text-ink">{event.title}</p>
        {event.detail ? <p className="mt-1 text-sm text-ink-soft">{event.detail}</p> : null}
        <p className="mt-1.5 text-xs text-ink-faint">
          {formatFullDate(event.date)}
          {authorName ? ` · ${authorName}` : ""}
        </p>
      </div>
    </div>
  );
}

function BadgeRow({ status }: { status: BadgeStatus }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border-2 border-amber-200 bg-linear-to-r from-amber-50 to-pink-50 p-4 shadow-soft dark:border-amber-900 dark:from-amber-950/50 dark:to-pink-950/40">
      <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-amber-300 to-pink-300 text-xl ring-4 ring-white dark:ring-slate-900">
        {status.badge.emoji}
      </span>

      <div className="min-w-0">
        <p className="font-display text-[1.05rem] font-semibold text-ink">
          Badge earned: {status.badge.name}
        </p>
        <p className="mt-1 text-sm text-ink-soft">{badgeUnlockText(status)}.</p>
        <p className="mt-1.5 text-xs text-ink-faint">{status.unlockedOn ? formatFullDate(status.unlockedOn) : ""}</p>
      </div>
    </div>
  );
}
