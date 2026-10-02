import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "../../app/constants";
import { useProfile } from "../../hooks/useAuth";
import { useJournal } from "../../hooks/useJournal";
import { usePartner } from "../../hooks/useWorld";
import type { JournalEntry, JournalMood } from "../../types/journal";
import { JOURNAL_MOODS } from "../../types/journal";
import { firstNameOf, cx } from "../../utils/helpers";
import { formatFullDate, formatMonthName, toDateKey, toMonthKey } from "../../utils/date";
import { NaturePanel } from "../ui/NaturePanel";

/**
 * Journal history, browsable month by month like a calendar.
 *
 * Step back through months, see at a glance which days have entries
 * (coloured by how the day felt), and tap a day to read what was written.
 */

const MOOD_STYLES: Record<JournalMood, { dot: string; chip: string }> = {
  bright: { dot: "bg-amber-400", chip: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" },
  warm: { dot: "bg-rose-400", chip: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200" },
  steady: { dot: "bg-emerald-400", chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" },
  tender: { dot: "bg-violet-400", chip: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200" },
  heavy: { dot: "bg-slate-400", chip: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);

  return toMonthKey(new Date(year, month - 1 + delta, 1));
}

export function JournalHistory() {
  const { entries } = useJournal();
  const profile = useProfile();
  const partner = usePartner();

  const currentMonth = toMonthKey(new Date());
  const [monthKey, setMonthKey] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();

    for (const entry of entries) {
      if (!entry.date.startsWith(monthKey)) continue;

      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }

    return map;
  }, [entries, monthKey]);

  const grid = useMemo(() => {
    const [year, month] = monthKey.split("-").map(Number);
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leading = (first.getDay() + 6) % 7;

    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => toDateKey(new Date(year, month - 1, index + 1))),
    ];
  }, [monthKey]);

  const visible = useMemo(() => {
    const days = selectedDay ? [selectedDay] : [...byDay.keys()].sort().reverse();

    return days.flatMap((day) => (byDay.get(day) ?? []).slice().sort((a, b) => b.createdAt - a.createdAt));
  }, [byDay, selectedDay]);

  const today = toDateKey(new Date());

  function nameFor(uid: string): string {
    if (profile && uid === profile.uid) return "You";
    if (partner && uid === partner.uid) return firstNameOf(partner.displayName);
    return "Someone";
  }

  function goToMonth(delta: number) {
    setMonthKey((key) => shiftMonth(key, delta));
    setSelectedDay(null);
  }

  return (
    <NaturePanel
      theme="dusk"
      eyebrow="flip back through the pages"
      title="Journal history"
      description="Revisit any month, like turning back a calendar. Tap a day to read what you wrote."
      action={
        <Link
          to={ROUTES.journal}
          className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:bg-violet-600"
        >
          <BookOpen aria-hidden className="size-4" />
          Write today
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* Month calendar */}
        <div className="rounded-3xl bg-white/75 p-4 shadow-soft backdrop-blur-sm dark:bg-white/5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              aria-label="Previous month"
              className="grid size-9 place-items-center rounded-full text-violet-700 transition-colors hover:bg-violet-100 dark:text-violet-200 dark:hover:bg-violet-900/50"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>

            <div className="text-center">
              <p className="font-display text-lg font-semibold text-ink">{formatMonthName(monthKey)}</p>
              {monthKey !== currentMonth ? (
                <button
                  type="button"
                  onClick={() => {
                    setMonthKey(currentMonth);
                    setSelectedDay(null);
                  }}
                  className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-300"
                >
                  Back to this month
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => goToMonth(1)}
              disabled={monthKey >= currentMonth}
              aria-label="Next month"
              className="grid size-9 place-items-center rounded-full text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-violet-200 dark:hover:bg-violet-900/50"
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-bold text-ink-faint">
            {WEEKDAYS.map((day, index) => (
              <span key={index}>{day}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {grid.map((day, index) => {
              if (!day) return <span key={`blank-${index}`} />;

              const dayEntries = byDay.get(day) ?? [];
              const mood = dayEntries.find((entry) => entry.mood)?.mood ?? null;
              const isSelected = selectedDay === day;
              const isFuture = day > today;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={dayEntries.length === 0}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  aria-pressed={isSelected}
                  aria-label={`${formatFullDate(day)}${dayEntries.length ? `, ${dayEntries.length} ${dayEntries.length === 1 ? "entry" : "entries"}` : ""}`}
                  className={cx(
                    "relative grid aspect-square place-items-center rounded-xl text-sm tabular-nums transition-all",
                    dayEntries.length > 0
                      ? "font-bold text-ink hover:scale-110 hover:bg-violet-100 dark:hover:bg-violet-900/40"
                      : "text-ink-faint",
                    isFuture && "opacity-40",
                    day === today && "ring-2 ring-violet-400",
                    isSelected && "bg-violet-500 text-white hover:bg-violet-500",
                  )}
                >
                  {Number(day.slice(8))}
                  {dayEntries.length > 0 ? (
                    <span
                      className={cx(
                        "absolute bottom-1 size-1.5 rounded-full",
                        isSelected ? "bg-white" : mood ? MOOD_STYLES[mood].dot : "bg-violet-400",
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
            {JOURNAL_MOODS.map((mood) => (
              <span key={mood.id} className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                <span className={cx("size-2 rounded-full", MOOD_STYLES[mood.id].dot)} />
                {mood.label}
              </span>
            ))}
          </div>
        </div>

        {/* Entries */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-soft">
            {selectedDay
              ? formatFullDate(selectedDay)
              : `${visible.length} ${visible.length === 1 ? "entry" : "entries"} in ${formatMonthName(monthKey)}`}
            {selectedDay ? (
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="ml-2 text-violet-600 hover:underline dark:text-violet-300"
              >
                Show whole month
              </button>
            ) : null}
          </p>

          {visible.length === 0 ? (
            <div className="mt-4 rounded-3xl border-2 border-dashed border-violet-200 bg-white/50 p-8 text-center dark:border-violet-800 dark:bg-white/5">
              <p className="ss-hand text-2xl text-violet-500">blank pages, for now</p>
              <p className="mt-1 text-sm text-ink-soft">
                Nothing was written this month. Try stepping back a month, or write something today.
              </p>
            </div>
          ) : (
            <ul className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {visible.map((entry, index) => (
                  <motion.li
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.04 }}
                  >
                    <JournalHistoryEntry entry={entry} author={nameFor(entry.authorUid)} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </NaturePanel>
  );
}

function JournalHistoryEntry({ entry, author }: { entry: JournalEntry; author: string }) {
  const [expanded, setExpanded] = useState(false);
  const mood = entry.mood ? JOURNAL_MOODS.find((candidate) => candidate.id === entry.mood) : null;
  const long = entry.body.length > 220;

  return (
    <article className="rounded-3xl bg-white/80 p-4 shadow-soft backdrop-blur-sm dark:bg-white/5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-ink">{author}</span>
        <span className="text-ink-faint">·</span>
        <span className="text-ink-faint">{formatFullDate(entry.date)}</span>
        {mood ? (
          <span className={cx("ml-auto rounded-full px-2.5 py-0.5 font-semibold", MOOD_STYLES[mood.id].chip)}>
            {mood.label}
          </span>
        ) : null}
      </div>

      {entry.title ? <h3 className="mt-2 text-lg font-semibold text-ink">{entry.title}</h3> : null}

      <p className={cx("mt-1.5 text-[0.95rem] leading-relaxed whitespace-pre-wrap text-ink-soft", !expanded && long && "line-clamp-4")}>
        {entry.body}
      </p>

      {long ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1 text-sm font-semibold text-violet-600 hover:underline dark:text-violet-300"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </article>
  );
}
