import type { WorldSnapshot, WorldState } from "../../types/world";
import { describeWorld } from "../../services/world";
import { formatPercent } from "../../utils/helpers";
import { NaturePanel } from "../ui/NaturePanel";

/**
 * A short account of where the world stands.
 *
 * One sentence of description and, once there is any history, how evenly
 * the two of you have grown. Nothing here is phrased as a score, and nothing
 * invites comparison against a previous week.
 */
export interface WorldSummaryProps {
  world: WorldState;
  snapshot: WorldSnapshot;
}

export function WorldSummary({ world, snapshot }: WorldSummaryProps) {
  const description = describeWorld(snapshot, world);

  return (
    <NaturePanel theme="forest" eyebrow="your world, right now">
      <p className="mt-1 max-w-2xl font-display text-xl leading-relaxed text-green-950 sm:text-2xl dark:text-green-50">
        {description}
      </p>

      {world.totalRituals > 0 ? (
        <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/80 py-2 pr-5 pl-2 shadow-soft dark:bg-white/10">
          <span className="grid size-9 place-items-center rounded-full bg-linear-to-br from-pink-400 to-orange-400 text-sm font-bold text-white">
            ♥
          </span>
          <span className="text-sm text-ink-soft">
            Harmony <span className="font-display text-lg font-semibold text-ink">{formatPercent(snapshot.harmony)}</span>
          </span>
        </div>
      ) : null}
    </NaturePanel>
  );
}
