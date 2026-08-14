import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { WorldEvent } from "../../types/world";
import { useCalendarMonth } from "../../hooks/usePlanning";
import { useTimeline } from "../../hooks/useTimeline";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  formatFullDate,
  formatMonthName,
  fromDateKey,
  startOfMonth,
  startOfWeek,
  toDateKey,
  toMonthKey,
  todayKey,
} from "../../utils/date";
import { cx } from "../../utils/helpers";
import { Button } from "../ui/Button";

/**
 * The calendar.
 *
 * The spec's own weekly/monthly planning and reflection already look at one
 * period at a time; nothing on Growth let a person actually see a month laid
 * out as a month. Built from data that already exists elsewhere — day
 * summaries the world already keeps (`getWorldHistory`) and the permanent
 * moments the Timeline already records — rather than inventing a parallel
 * tracking system.
 *
 * A day's two small marks answer two different questions: the accent dot is
 * "was anything honoured here", sized by how much; the second dot is "did
 * something worth remembering happen here" — a note, a journal page, a
 * memory, or a milestone the world itself reached.
 */

type EventKind = "kept" | "milestone";

const KEPT_EVENT_TYPES = new Set(["note-left", "journal-entry", "memory-saved", "plan-created"]);

function eventKind(event: WorldEvent): EventKind {
  return KEPT_EVENT_TYPES.has(event.type) ? "kept" : "milestone";
}

export function MonthCalendar() {
  const today = todayKey();
  const [monthKey, setMonthKey] = useState(() => toMonthKey(fromDateKey(today)));
  const [selectedKey, setSelectedKey] = useState<string>(today);

  const { history, isLoading } = useCalendarMonth(monthKey);
  const events = useTimeline();

  const monthDate = fromDateKey(`${monthKey}-01`);
  const gridStart = startOfWeek(startOfMonth(monthDate));
  const gridEnd = endOfWeek(endOfMonth(monthDate));

  const eventsByDate = useMemo(() => {
    const map = new Map<string, WorldEvent[]>();

    for (const event of events) {
      const bucket = map.get(event.date);

      if (bucket) {
        bucket.push(event);
      } else {
        map.set(event.date, [event]);
      }
    }

    return map;
  }, [events]);

  const maxEnergy = Math.max(1, ...Object.values(history).map((day) => day.energy));

  const days = useMemo(() => {
    const cells: Array<{
      date: string;
      dayOfMonth: number;
      inMonth: boolean;
      isToday: boolean;
    }> = [];

    let cursor = gridStart;

    while (cursor.getTime() <= gridEnd.getTime()) {
      const date = toDateKey(cursor);

      cells.push({
        date,
        dayOfMonth: cursor.getDate(),
        inMonth: cursor.getMonth() === monthDate.getMonth(),
        isToday: date === today,
      });

      cursor = addDays(cursor, 1);
    }

    return cells;
  }, [gridStart, gridEnd, monthDate, today]);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date());

    return Array.from({ length: 7 }, (_, index) =>
      addDays(start, index).toLocaleDateString(undefined, { weekday: "short" }),
    );
  }, []);

  const selectedSummary = history[selectedKey] ?? null;
  const selectedEvents = eventsByDate.get(selectedKey) ?? [];

  function changeMonth(delta: number): void {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1);
    setMonthKey(toMonthKey(next));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg text-ink">{formatMonthName(monthKey)}</h2>

        <div className="flex items-center gap-1">
          {monthKey !== toMonthKey(fromDateKey(today)) ? (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                setMonthKey(toMonthKey(fromDateKey(today)));
                setSelectedKey(today);
              }}
            >
              Today
            </Button>
          ) : null}

          <button
            type="button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
            className="grid size-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <ChevronLeft aria-hidden className="size-4" strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
            className="grid size-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <ChevronRight aria-hidden className="size-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs text-ink-faint">
        {weekdayLabels.map((label) => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className={cx("mt-1 grid grid-cols-7 gap-1", isLoading && "opacity-60")}>
        {days.map((day) => {
          const summary = history[day.date];
          const dayEvents = eventsByDate.get(day.date) ?? [];
          const kind = dayEvents.length > 0 ? dayEvents.some((event) => eventKind(event) === "milestone") ? "milestone" : "kept" : null;
          const energyRatio = summary ? Math.min(1, summary.energy / maxEnergy) : 0;
          const isFuture = day.date > today;
          const isSelected = day.date === selectedKey;

          return (
            <button
              key={day.date}
              type="button"
              disabled={!day.inMonth}
              onClick={() => setSelectedKey(day.date)}
              aria-pressed={isSelected}
              aria-label={`${formatFullDate(day.date)}${summary ? `, ${summary.rituals} ${summary.rituals === 1 ? "ritual" : "rituals"}` : ""}`}
              className={cx(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition-colors duration-200 ease-(--ease-calm)",
                !day.inMonth && "pointer-events-none opacity-0",
                day.inMonth && !isSelected && "hover:bg-surface-sunken",
                isSelected && "bg-accent-soft text-accent-strong",
                !isSelected && day.isToday && "font-medium text-ink",
                !isSelected && !day.isToday && "text-ink-soft",
                isFuture && !isSelected && "text-ink-faint",
              )}
            >
              <span>{day.dayOfMonth}</span>

              <span className="flex h-1.5 items-center gap-0.5">
                {summary ? (
                  <span
                    aria-hidden
                    className="block size-1.5 rounded-full bg-accent"
                    style={{ opacity: 0.35 + energyRatio * 0.65 }}
                  />
                ) : null}

                {kind ? (
                  <span
                    aria-hidden
                    className={cx(
                      "block size-1.5 rounded-full",
                      kind === "milestone" ? "bg-ember" : "bg-bloom",
                    )}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <p className="text-[0.95rem] text-ink">{formatFullDate(selectedKey)}</p>

        {selectedSummary ? (
          <p className="mt-1 text-sm text-ink-soft">
            {selectedSummary.rituals} {selectedSummary.rituals === 1 ? "ritual" : "rituals"} honoured
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-faint">
            {selectedKey > today ? "Not lived yet." : "Nothing honoured this day."}
          </p>
        )}

        {selectedEvents.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {selectedEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-2 text-sm text-ink-soft">
                <span
                  aria-hidden
                  className={cx(
                    "block size-1.5 shrink-0 rounded-full",
                    eventKind(event) === "milestone" ? "bg-ember" : "bg-bloom",
                  )}
                />
                {event.title}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
