import { useProfile } from "../hooks/useAuth";
import { usePartner, useWorldSnapshot, useWorldState, useWorldStatus } from "../hooks/useWorld";
import { useDomainShares, useProgressSeries } from "../hooks/usePlanning";
import { useWorldStore } from "../store/worldStore";
import { CompletionChart } from "../components/world/CompletionChart";
import { DomainShareBars } from "../components/world/DomainShareBars";
import { EnergyChart } from "../components/world/EnergyChart";
import { GrowthPeriod } from "../components/world/GrowthPeriod";
import { Card, EmptyState, SectionHeading } from "../components/ui/Card";
import { Spinner } from "../components/ui/Icon";
import { formatPercent } from "../utils/helpers";
import type { RitualId } from "../types/ritual";

/**
 * A stable "no practice yet" fallback.
 *
 * `state.ritualPlan?.ritualIds ?? []` looks harmless but is not: the `[]`
 * literal is a new array on every single invocation, so whenever `ritualPlan`
 * is `null` the store's `getSnapshot` never returns a referentially equal
 * value twice in a row. `useSyncExternalStore` (what Zustand is built on)
 * treats that as "the store is still changing" and keeps re-rendering
 * forever. A module-level constant is stable across renders, so the fallback
 * itself can never be the reason the snapshot looks different.
 */
const EMPTY_RITUAL_IDS: RitualId[] = [];

/**
 * Growth.
 *
 * Where the shared world's recent history becomes visible at a glance. Reads
 * as an account of what happened, never as a scoreboard — there is no target
 * line, and no colour on this screen means "behind".
 */
export default function DashboardPage() {
  const profile = useProfile();
  const partner = usePartner();
  const world = useWorldState();
  const snapshot = useWorldSnapshot();
  const status = useWorldStatus();
  const error = useWorldStore((state) => state.error);
  const history = useWorldStore((state) => state.history);
  const domainShares = useDomainShares();
  const practiceRitualIds = useWorldStore(
    (state) => state.ritualPlan?.ritualIds ?? EMPTY_RITUAL_IDS,
  );
  const progressSeries = useProgressSeries(practiceRitualIds);

  if (status === "error") {
    return (
      <div className="ss-container py-16">
        <EmptyState
          title="Growth couldn't open"
          description={error ?? "Something interrupted the connection. Refreshing usually helps."}
        />
      </div>
    );
  }

  if (status === "idle" || status === "loading" || !world || !snapshot) {
    return (
      <div className="grid min-h-[60svh] place-items-center">
        <Spinner label="Gathering your history" />
      </div>
    );
  }

  if (world.totalRituals === 0) {
    return (
      <div className="ss-container py-16">
        <EmptyState
          title="Nothing to show yet"
          description="Once you've honoured a few rituals, their pattern will start to appear here."
        />
      </div>
    );
  }

  const contributions = [
    profile ? { name: profile.displayName, contribution: world.contributions[profile.uid] } : null,
    partner ? { name: partner.displayName, contribution: world.contributions[partner.uid] } : null,
  ].filter((entry): entry is { name: string; contribution: (typeof world.contributions)[string] } =>
    Boolean(entry?.contribution),
  );

  return (
    <div className="ss-container max-w-3xl py-12">
      <SectionHeading level={1} title="Growth" description="The last two weeks, at a glance." />

      <Card padding="md" className="mt-8">
        <h2 className="text-lg text-ink">The shared world, recently</h2>
        <div className="mt-5">
          <EnergyChart history={history} />
        </div>
      </Card>

      <Card padding="md" className="mt-6">
        <h2 className="text-lg text-ink">Your own completion</h2>
        <div className="mt-5">
          <CompletionChart series={progressSeries} />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Harmony" value={formatPercent(snapshot.harmony)} />
        <Stat label="This month" value={String(snapshot.recentEnergy)} />
        <Stat label="Lifetime rituals" value={String(world.totalRituals)} />
        <Stat label="Active days" value={String(world.activeDays)} />
      </div>

      {contributions.length > 0 ? (
        <Card padding="md" className="mt-6">
          <h2 className="text-lg text-ink">How you've both been showing up</h2>

          <div className="mt-5 space-y-4">
            {contributions.map(({ name, contribution }) => (
              <div key={name}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink">{name}</span>
                  <span className="text-ink-faint">
                    {contribution.rituals} {contribution.rituals === 1 ? "ritual" : "rituals"} ·{" "}
                    {contribution.activeDays} {contribution.activeDays === 1 ? "day" : "days"}
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full bg-accent/70"
                    style={{
                      width: `${Math.min(100, Math.round((contribution.energy / Math.max(1, world.totalEnergy)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {domainShares.length > 0 ? (
        <Card padding="md" className="mt-6">
          <h2 className="text-lg text-ink">Where recent energy has gone</h2>
          <div className="mt-5">
            <DomainShareBars shares={domainShares} />
          </div>
        </Card>
      ) : null}

      <div className="mt-6">
        <GrowthPeriod />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card tone="sunken" padding="sm">
      <p className="text-xs tracking-wide text-ink-faint uppercase">{label}</p>
      <p className="mt-1.5 text-2xl text-ink">{value}</p>
    </Card>
  );
}
