import type { ProgressSeries } from "../../types/planning";
import { formatPercent } from "../../utils/helpers";
import { cx } from "../../utils/helpers";

/**
 * Daily completion, as a percentage of your own chosen practice.
 *
 * Distinct from `EnergyChart`, which shows the shared world's raw activity —
 * this is personal, and reads as a proportion (0–100%) rather than a count,
 * which is what the specification asks completion to look like.
 */
export function CompletionChart({ series }: { series: ProgressSeries }) {
  if (series.points.every((point) => point.intended === 0)) {
    return (
      <p className="text-sm text-ink-faint">
        Choose a practice on the World screen to see your completion here.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-2">
        {series.points.map((point) => (
          <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex h-28 w-full items-end sm:h-36"
              title={`${point.label}: ${formatPercent(point.completion)}`}
            >
              <div
                className={cx(
                  "w-full rounded-t-md transition-[height] duration-500 ease-(--ease-settle)",
                  point.isFuture
                    ? "bg-line"
                    : point.completion > 0
                      ? "bg-water/70"
                      : "bg-line",
                )}
                style={{
                  height: `${Math.max(point.completion > 0 ? 6 : 3, Math.round(point.completion * 100))}%`,
                }}
              />
            </div>

            <span className="text-[0.7rem] tabular-nums text-ink-faint">{point.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-ink-faint">
        {formatPercent(series.averageCompletion)} average completion of your own practice.
      </p>
    </div>
  );
}
