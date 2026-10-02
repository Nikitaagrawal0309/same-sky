import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

import type { LiveWeatherState } from "../../hooks/useLiveWeather";
import { useNow } from "../../hooks/useWorld";
import { usePrefersStillness } from "../../hooks/useTheme";
import { toDateKey } from "../../utils/date";
import { cx } from "../../utils/helpers";

/**
 * A live clock, today's date and the real weather, floating over the sky.
 *
 * Ticks every second in the viewer's own locale (12- or 24-hour, whichever
 * they use). Tapping the date opens a little month calendar that always
 * marks today. Only this widget re-renders each second; the scene behind it
 * keeps its own, slower clock.
 */
export function LiveClock({ live }: { live: LiveWeatherState }) {
  const now = useNow(1000);
  const still = usePrefersStillness();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const parts = useMemo(() => {
    const formatted = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(now);
    const get = (type: Intl.DateTimeFormatPartTypes) => formatted.find((part) => part.type === type)?.value ?? "";

    return { hour: get("hour"), minute: get("minute"), second: get("second"), period: get("dayPeriod") };
  }, [now]);

  const dateLabel = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  const shortDateLabel = now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

  // Close the calendar on an outside click or Escape.
  useEffect(() => {
    if (!calendarOpen) return;

    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setCalendarOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCalendarOpen(false);
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [calendarOpen]);

  return (
    <div ref={rootRef} className="relative w-fit">
      <div className="flex items-stretch gap-2.5 rounded-3xl border border-white/25 bg-black/25 px-3 py-2 text-white shadow-lg backdrop-blur-md sm:gap-3 sm:px-4 sm:py-2.5">
        {/* Clock */}
        <div>
          <p className="font-display leading-none font-semibold tabular-nums drop-shadow" aria-live="off">
            <span className="text-[1.65rem] sm:text-4xl">
              {parts.hour}:{parts.minute}
            </span>
            <motion.span
              key={parts.second}
              className="ml-0.5 inline-block min-w-[2.2ch] align-top text-sm text-white/75 sm:text-lg"
              initial={still ? false : { y: -6, opacity: 0.2 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {parts.second}
            </motion.span>
            {parts.period ? <span className="ml-0.5 text-xs text-white/80 uppercase sm:ml-1 sm:text-sm">{parts.period}</span> : null}
          </p>

          <button
            type="button"
            onClick={() => setCalendarOpen((open) => !open)}
            aria-expanded={calendarOpen}
            aria-haspopup="dialog"
            className="mt-1 inline-flex items-center gap-1.5 rounded-full text-xs font-semibold whitespace-nowrap text-white/90 hover:text-white sm:text-sm"
          >
            <CalendarDays aria-hidden className="size-3.5" />
            <span className="sm:hidden">{shortDateLabel}</span>
            <span className="hidden sm:inline">{dateLabel}</span>
          </button>
        </div>

        {/* Weather */}
        <div className="flex flex-col justify-center border-l border-white/25 pl-2.5 text-sm sm:pl-3">
          {live.weather ? (
            <>
              <p className="flex items-center gap-1.5 font-display text-xl leading-none font-semibold">
                <span aria-hidden className="text-2xl">{live.weather.emoji}</span>
                {live.weather.temperature}°
              </p>
              <p className="mt-1 text-xs font-semibold text-white/85">{live.weather.description}</p>
              {live.place ? (
                <p className="flex items-center gap-1 text-xs text-white/70">
                  <MapPin aria-hidden className="size-3" />
                  {live.place}
                </p>
              ) : null}
            </>
          ) : live.status === "locating" ? (
            <p className="text-xs text-white/80">Checking the sky…</p>
          ) : (
            <button
              type="button"
              onClick={live.retry}
              className="inline-flex max-w-28 items-center gap-1.5 text-left text-[0.7rem] leading-tight font-semibold text-white/90 underline-offset-2 hover:underline sm:max-w-36 sm:text-xs"
            >
              <MapPin aria-hidden className="size-3.5 shrink-0" />
              {live.status === "denied" ? "Allow location for real weather" : "Show my real weather"}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {calendarOpen ? (
          <motion.div
            role="dialog"
            aria-label="Calendar"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 z-30 mt-2 origin-top-left"
          >
            <MiniCalendar today={now} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function MiniCalendar({ today }: { today: Date }) {
  const [offset, setOffset] = useState(0);
  const todayKey = toDateKey(today);

  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leading = (month.getDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ];

  return (
    <div className="w-[min(18rem,calc(100vw-2.5rem))] rounded-3xl border-2 border-white/80 bg-white/95 p-4 text-ink shadow-floating backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setOffset((value) => value - 1)}
          className="grid size-8 place-items-center rounded-full text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/40"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        <div className="text-center">
          <p className="font-display text-lg font-semibold">
            {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          {offset !== 0 ? (
            <button type="button" onClick={() => setOffset(0)} className="text-xs font-bold text-orange-600 hover:underline">
              Back to today
            </button>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setOffset((value) => value + 1)}
          className="grid size-8 place-items-center rounded-full text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/40"
        >
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 text-center text-[0.7rem] font-bold text-ink-faint">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5 text-center text-sm tabular-nums">
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} />;

          const isToday = toDateKey(date) === todayKey;
          const weekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <span
              key={date.getDate()}
              aria-current={isToday ? "date" : undefined}
              className={cx(
                "relative grid aspect-square place-items-center rounded-full",
                isToday
                  ? "bg-linear-to-br from-orange-400 to-pink-500 font-bold text-white shadow-md"
                  : weekend
                    ? "text-pink-600 dark:text-pink-300"
                    : "text-ink",
              )}
            >
              {isToday ? <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-pink-400/30" /> : null}
              <span className="relative">{date.getDate()}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
