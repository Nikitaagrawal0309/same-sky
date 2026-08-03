import type { WorldSnapshot, WorldState } from "../../types/world";
import { describeWorld } from "../../services/world";
import { formatDuration } from "../../utils/date";
import { formatPercent } from "../../utils/helpers";

/**
 * A short account of where the world stands.
 *
 * Exactly one sentence of description and a small handful of figures — the
 * age of the world, the tree's stage, how evenly the two of you have grown.
 * Nothing here is phrased as a score, and nothing invites comparison against a
 * previous week.
 */
export interface WorldSummaryProps {
  world: WorldState;
  snapshot: WorldSnapshot;
}

export function WorldSummary({ world, snapshot }: WorldSummaryProps) {
  const description = describeWorld(snapshot, world);

  return (
    <div>
      <p className="max-w-xl text-lg leading-relaxed text-ink">{description}</p>

      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
        <div>
          <dt className="text-xs tracking-wide text-ink-faint uppercase">Your tree</dt>
          <dd className="mt-1 text-[0.95rem] text-ink-soft">{snapshot.tree.stage.label}</dd>
        </div>

        <div>
          <dt className="text-xs tracking-wide text-ink-faint uppercase">Together</dt>
          <dd className="mt-1 text-[0.95rem] text-ink-soft">
            {formatDuration(snapshot.ageInDays)}
          </dd>
        </div>

        {world.totalRituals > 0 ? (
          <div>
            <dt className="text-xs tracking-wide text-ink-faint uppercase">Harmony</dt>
            <dd className="mt-1 text-[0.95rem] text-ink-soft">
              {formatPercent(snapshot.harmony)}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
