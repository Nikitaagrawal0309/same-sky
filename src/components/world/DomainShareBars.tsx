import type { DomainShare } from "../../types/planning";
import { formatPercent } from "../../utils/helpers";

/**
 * How recent rituals have been spread across body, mind, craft and together.
 *
 * A breakdown, not a ranking — there is no "best" distribution, so nothing
 * here is sorted by size beyond the catalogue's own natural order.
 */
export function DomainShareBars({ shares }: { shares: DomainShare[] }) {
  if (shares.length === 0) return null;

  return (
    <div className="space-y-3">
      {shares.map((share) => (
        <div key={share.domain}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink">{share.label}</span>
            <span className="text-ink-faint">
              {share.count} · {formatPercent(share.share)}
            </span>
          </div>

          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-accent/70"
              style={{ width: `${Math.round(share.share * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
