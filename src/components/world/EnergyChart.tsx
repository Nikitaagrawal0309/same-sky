import { useMemo } from "react";

import type { DateKey } from "../../types/database";
import type { WorldDaySummary } from "../../types/world";
import { formatWeekdayShort, recentDateKeys, todayKey } from "../../utils/date";
import { cx } from "../../utils/helpers";

/**
 * Recent days, as bars.
 *
 * This is a small, honest chart rather than a dashboard: it shows what
 * happened, at a glance, with no target line and no colour that reads as
 * "good" or "bad". A quiet week produces short bars, not red ones.
 */
export interface EnergyChartProps {
  history: Record<DateKey, WorldDaySummary>;
  days?: number;
  className?: string;
}

export function EnergyChart({ history, days = 14, className }: EnergyChartProps) {
  const today = todayKey();

  const points = useMemo(() => {
    const keys = recentDateKeys(days, today);
    const maxEnergy = Math.max(1, ...keys.map((key) => history[key]?.energy ?? 0));

    return keys.map((key) => ({
      date: key,
      label: formatWeekdayShort(key),
      energy: history[key]?.energy ?? 0,
      rituals: history[key]?.rituals ?? 0,
      isToday: key === today,
      heightPercent: Math.round(((history[key]?.energy ?? 0) / maxEnergy) * 100),
    }));
  }, [history, days, today]);

  return (
    <div className={cx("flex items-end gap-1.5 sm:gap-2", className)}>
      {points.map((point) => (
        <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="flex h-28 w-full items-end sm:h-36"
            title={`${point.label}: ${point.rituals} ${point.rituals === 1 ? "ritual" : "rituals"}`}
          >
            <div
              className={cx(
                "w-full rounded-t-md transition-[height] duration-500 ease-(--ease-settle)",
                point.energy > 0 ? "bg-accent/70" : "bg-line",
                point.isToday && point.energy > 0 && "bg-accent",
              )}
              style={{ height: `${Math.max(point.energy > 0 ? 6 : 3, point.heightPercent)}%` }}
            />
          </div>

          <span
            className={cx(
              "text-[0.7rem] tabular-nums",
              point.isToday ? "font-medium text-ink" : "text-ink-faint",
            )}
          >
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}
