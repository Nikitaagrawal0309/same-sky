import type { MonthlyOverviewPoint } from "../../hooks/usePlanning";
import { cx } from "../../utils/helpers";

/**
 * A year, at a glance.
 *
 * Everything else on Growth looks at the last two to four weeks. The
 * specification asks for growth to be visible at every timescale up to
 * "yearly: major world evolution" — this is the one chart on the page built
 * for that longer view, twelve months of rituals honoured, side by side.
 */
export function YearChart({ points }: { points: MonthlyOverviewPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.rituals));

  return (
    <div className="flex items-end gap-1.5 sm:gap-2.5">
      {points.map((point) => (
        <div key={point.monthKey} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="flex h-24 w-full items-end sm:h-32"
            title={`${point.label}: ${point.rituals} ${point.rituals === 1 ? "ritual" : "rituals"}`}
          >
            <div
              className={cx(
                "w-full rounded-t-md transition-[height] duration-700 ease-(--ease-settle)",
                point.rituals > 0 ? "bg-bloom/60" : "bg-line",
                point.isCurrent && point.rituals > 0 && "bg-bloom",
              )}
              style={{
                height: `${Math.max(point.rituals > 0 ? 6 : 3, Math.round((point.rituals / max) * 100))}%`,
              }}
            />
          </div>

          <span
            className={cx(
              "text-[0.7rem] tabular-nums",
              point.isCurrent ? "font-medium text-ink" : "text-ink-faint",
            )}
          >
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}
