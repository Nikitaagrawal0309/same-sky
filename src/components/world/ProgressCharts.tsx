import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useYearlyOverview } from "../../hooks/usePlanning";
import { useWorldStore } from "../../store/worldStore";
import { cx } from "../../utils/helpers";
import {
  addDaysToKey,
  formatDayAndMonth,
  formatWeekdayShort,
  fromDateKey,
  recentDateKeys,
  startOfWeek,
  toDateKey,
} from "../../utils/date";
import { NaturePanel } from "../ui/NaturePanel";

/**
 * Weekly and monthly progress, as charts.
 *
 * Built from the 90 days of history the world store already holds (no extra
 * reads) plus the 12-month overview Growth already uses. Shows what
 * happened with no target line, and no colour that means "behind".
 */

type Range = "week" | "month";

/** How many weeks back the weekly view can step (history covers ~90 days). */
const MAX_WEEKS_BACK = 11;

export function ProgressCharts() {
  const history = useWorldStore((state) => state.history);
  const yearly = useYearlyOverview();
  const [range, setRange] = useState<Range>("week");
  const [weekOffset, setWeekOffset] = useState(0);

  const today = toDateKey(new Date());
  const ritualsOn = (key: string) => history[key]?.rituals ?? 0;

  const week = useMemo(() => {
    const monday = toDateKey(startOfWeek(new Date()));
    const start = addDaysToKey(monday, -7 * weekOffset);
    const days = Array.from({ length: 7 }, (_, index) => addDaysToKey(start, index));
    const previous = Array.from({ length: 7 }, (_, index) => addDaysToKey(start, index - 7));

    return {
      start,
      end: days[6],
      points: days.map((key) => ({
        key,
        label: formatWeekdayShort(key),
        value: history[key]?.rituals ?? 0,
        highlight: key === today,
        future: key > today,
      })),
      total: days.reduce((sum, key) => sum + (history[key]?.rituals ?? 0), 0),
      activeDays: days.filter((key) => (history[key]?.rituals ?? 0) > 0).length,
      previousTotal: previous.reduce((sum, key) => sum + (history[key]?.rituals ?? 0), 0),
    };
  }, [history, weekOffset, today]);

  const weeklyTrend = useMemo(() => {
    const monday = toDateKey(startOfWeek(new Date()));

    return Array.from({ length: 12 }, (_, index) => {
      const start = addDaysToKey(monday, -7 * (11 - index));
      const total = Array.from({ length: 7 }, (_, day) => history[addDaysToKey(start, day)]?.rituals ?? 0).reduce(
        (sum, value) => sum + value,
        0,
      );

      return { key: start, label: fromDateKey(start).toLocaleDateString(undefined, { day: "numeric", month: "short" }), value: total };
    });
  }, [history]);

  const last30 = useMemo(
    () =>
      recentDateKeys(30, today).map((key) => ({
        key,
        label: formatDayAndMonth(key),
        value: history[key]?.rituals ?? 0,
      })),
    [history, today],
  );

  const monthKey = today.slice(0, 7);
  const monthDays = Object.keys(history).filter((key) => key.startsWith(monthKey));
  const monthTotal = monthDays.reduce((sum, key) => sum + ritualsOn(key), 0);
  const monthActive = monthDays.filter((key) => ritualsOn(key) > 0).length;
  const bestMonth = yearly.points.reduce<(typeof yearly.points)[number] | null>(
    (best, point) => (point.rituals > (best?.rituals ?? 0) ? point : best),
    null,
  );

  const change = week.total - week.previousTotal;

  return (
    <NaturePanel
      theme="sunset"
      eyebrow="look how far you've come"
      title="Your progress"
      description="Weekly and monthly rhythms of everything you've honoured."
      action={
        <div role="tablist" aria-label="Range" className="flex rounded-full bg-white/70 p-1 shadow-soft dark:bg-white/10">
          {(["week", "month"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={range === option}
              onClick={() => setRange(option)}
              className={cx(
                "relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                range === option ? "text-white" : "text-orange-800 hover:text-orange-950 dark:text-orange-200",
              )}
            >
              {range === option ? (
                <motion.span
                  layoutId="progress-range-pill"
                  className="absolute inset-0 rounded-full bg-linear-to-r from-orange-500 to-pink-500"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              ) : null}
              <span className="relative">{option === "week" ? "Weekly" : "Monthly"}</span>
            </button>
          ))}
        </div>
      }
    >
      {range === "week" ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatTile label="Rituals this week" value={String(week.total)} tone="emerald" />
            <StatTile label="Days you showed up" value={`${week.activeDays} / 7`} tone="sky" />
            <StatTile
              label="vs. last week"
              value={change === 0 ? "Same" : `${change > 0 ? "+" : ""}${change}`}
              tone="amber"
            />
          </div>

          <ChartCard
            title="Rituals each day"
            subtitle={`${formatDayAndMonth(week.start)} – ${formatDayAndMonth(week.end)}`}
            controls={
              <div className="flex items-center gap-1">
                <IconButton
                  label="Previous week"
                  disabled={weekOffset >= MAX_WEEKS_BACK}
                  onClick={() => setWeekOffset((offset) => offset + 1)}
                >
                  <ChevronLeft aria-hidden className="size-4" />
                </IconButton>
                <IconButton label="Next week" disabled={weekOffset === 0} onClick={() => setWeekOffset((offset) => offset - 1)}>
                  <ChevronRight aria-hidden className="size-4" />
                </IconButton>
              </div>
            }
          >
            <BarChart points={week.points} from="#34d399" to="#059669" unit="ritual" />
          </ChartCard>

          <ChartCard title="Weekly totals" subtitle="The last 12 weeks">
            <AreaChart points={weeklyTrend} colour="#0ea5e9" unit="ritual" labelEvery={2} />
          </ChartCard>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatTile label="Rituals this month" value={String(monthTotal)} tone="amber" />
            <StatTile label="Active days" value={String(monthActive)} tone="pink" />
            <StatTile
              label="Your fullest month"
              value={bestMonth ? `${bestMonth.label} · ${bestMonth.rituals}` : "—"}
              tone="lime"
            />
          </div>

          <ChartCard title="Rituals each day" subtitle="The last 30 days">
            <AreaChart points={last30} colour="#f59e0b" unit="ritual" labelEvery={5} />
          </ChartCard>

          <ChartCard title="Rituals each month" subtitle="The last 12 months">
            {yearly.isLoading ? (
              <div className="h-40 animate-pulse rounded-2xl bg-white/60 dark:bg-white/5" />
            ) : (
              <BarChart
                points={yearly.points.map((point) => ({
                  key: point.monthKey,
                  label: point.label,
                  value: point.rituals,
                  highlight: point.isCurrent,
                  future: false,
                }))}
                from="#f472b6"
                to="#db2777"
                unit="ritual"
              />
            )}
          </ChartCard>
        </div>
      )}
    </NaturePanel>
  );
}

const TILE_TONES = {
  emerald: "from-emerald-400 to-teal-500",
  sky: "from-sky-400 to-blue-500",
  amber: "from-amber-400 to-orange-500",
  pink: "from-pink-400 to-rose-500",
  lime: "from-lime-400 to-green-500",
} as const;

function StatTile({ label, value, tone }: { label: string; value: string; tone: keyof typeof TILE_TONES }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white/80 p-3 shadow-soft backdrop-blur-sm sm:flex-row sm:items-center sm:gap-3 sm:rounded-3xl sm:p-4 dark:bg-white/5">
      <span className={cx("h-1.5 w-8 shrink-0 rounded-full bg-linear-to-r sm:h-10 sm:w-1.5 sm:bg-linear-to-b", TILE_TONES[tone])} />
      <div className="min-w-0">
        <p className="text-[0.7rem] leading-tight font-semibold text-ink-soft sm:text-xs">{label}</p>
        <p className="mt-0.5 truncate font-display text-lg font-semibold text-ink tabular-nums sm:text-2xl">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  controls,
  children,
}: {
  title: string;
  subtitle: string;
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white/80 p-4 shadow-soft backdrop-blur-sm sm:p-5 dark:bg-white/5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <p className="text-sm text-ink-faint">{subtitle}</p>
        </div>
        {controls}
      </div>
      {children}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-orange-200 dark:hover:bg-orange-900/40"
    >
      {children}
    </button>
  );
}

interface BarPoint {
  key: string;
  label: string;
  value: number;
  highlight: boolean;
  future: boolean;
}

/** Vertical bars that grow up on mount, with a tooltip on hover or focus. */
function BarChart({ points, from, to, unit }: { points: BarPoint[]; from: string; to: string; unit: string }) {
  const max = Math.max(1, ...points.map((point) => point.value));

  return (
    <div className="flex h-44 items-end gap-1.5 sm:gap-2.5">
      {points.map((point, index) => {
        const height = point.value > 0 ? Math.max(6, (point.value / max) * 100) : 3;

        return (
          <div
            key={point.key}
            tabIndex={0}
            className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2 outline-none"
            aria-label={`${point.label}: ${point.value} ${point.value === 1 ? unit : `${unit}s`}`}
          >
            <span className="pointer-events-none absolute -top-1 z-10 rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {point.value} {point.value === 1 ? unit : `${unit}s`}
            </span>
            <div className="flex w-full flex-1 items-end">
              <motion.div
                className="w-full rounded-t-[4px] transition-[filter] group-hover:brightness-110"
                style={{
                  background: point.future ? "var(--ss-border)" : point.value > 0 ? `linear-gradient(to top, ${to}, ${from})` : "var(--ss-border)",
                  boxShadow: point.highlight && point.value > 0 ? `0 0 0 2px var(--ss-surface), 0 0 0 4px ${to}` : undefined,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.7, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className={cx("text-[0.7rem] tabular-nums", point.highlight ? "font-bold text-ink" : "text-ink-faint")}>
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface LinePoint {
  key: string;
  label: string;
  value: number;
}

/** A smooth area chart with a hover crosshair and tooltip. */
function AreaChart({
  points,
  colour,
  unit,
  labelEvery,
}: {
  points: LinePoint[];
  colour: string;
  unit: string;
  labelEvery: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = `area-${colour.slice(1)}`;

  const width = 600;
  const height = 170;
  const pad = { top: 12, bottom: 4 };
  const max = Math.max(1, ...points.map((point) => point.value));
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const coords = points.map((point, index) => ({
    x: index * step,
    y: pad.top + (1 - point.value / max) * (height - pad.top - pad.bottom),
  }));

  // Smooth the line with a simple cardinal-style curve.
  const line = coords
    .map((point, index) => {
      if (index === 0) return `M${point.x},${point.y}`;

      const previous = coords[index - 1];
      const midX = (previous.x + point.x) / 2;

      return `C${midX},${previous.y} ${midX},${point.y} ${point.x},${point.y}`;
    })
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    const bounds = ref.current?.getBoundingClientRect();

    if (!bounds) return;

    const ratio = (event.clientX - bounds.left) / bounds.width;
    setHover(Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1)))));
  }

  const active = hover !== null ? points[hover] : null;
  const activeCoord = hover !== null ? coords[hover] : null;

  return (
    <div>
      <div
        ref={ref}
        className="relative h-44 touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="size-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colour} stopOpacity={0.45} />
              <stop offset="100%" stopColor={colour} stopOpacity={0.02} />
            </linearGradient>
            {/* Reveals the chart left to right on mount. */}
            <clipPath id={`${gradientId}-reveal`}>
              <motion.rect
                x={0}
                y={-10}
                height={height + 20}
                initial={{ width: 0 }}
                animate={{ width: width + 10 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </clipPath>
          </defs>

          {[0.25, 0.5, 0.75].map((fraction) => (
            <line
              key={fraction}
              x1={0}
              x2={width}
              y1={pad.top + fraction * (height - pad.top - pad.bottom)}
              y2={pad.top + fraction * (height - pad.top - pad.bottom)}
              stroke="var(--ss-border)"
              strokeDasharray="4 6"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <g clipPath={`url(#${gradientId}-reveal)`}>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke={colour}
              strokeWidth={2.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {activeCoord ? (
            <line
              x1={activeCoord.x}
              x2={activeCoord.x}
              y1={0}
              y2={height}
              stroke="var(--ss-ink-faint)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        {activeCoord && active ? (
          <>
            <span
              className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{
                left: `${(activeCoord.x / width) * 100}%`,
                top: `${(activeCoord.y / height) * 100}%`,
                background: colour,
              }}
            />
            <span
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg"
              style={{ left: `${Math.min(90, Math.max(10, (activeCoord.x / width) * 100))}%` }}
            >
              <span className="block text-white/70">{active.label}</span>
              <span className="font-semibold">
                {active.value} {active.value === 1 ? unit : `${unit}s`}
              </span>
            </span>
          </>
        ) : null}
      </div>

      <div className="mt-2 flex justify-between text-[0.7rem] text-ink-faint tabular-nums">
        {points.map((point, index) =>
          index % labelEvery === 0 || index === points.length - 1 ? (
            <span key={point.key}>{point.label}</span>
          ) : null,
        )}
      </div>
    </div>
  );
}
