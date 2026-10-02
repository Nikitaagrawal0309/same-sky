import { RECENT_WINDOW_DAYS } from "../app/constants";
import { useProfile } from "../hooks/useAuth";
import { usePartner, useWorldSnapshot, useWorldState, useWorldStatus } from "../hooks/useWorld";
import { useDomainShares, useProgressSeries, useYearlyOverview } from "../hooks/usePlanning";
import { useWorldStore } from "../store/worldStore";
import { CompletionChart } from "../components/world/CompletionChart";
import { EnergyChart } from "../components/world/EnergyChart";
import { GrowthGarden } from "../components/world/GrowthGarden";
import { GrowthPeriod } from "../components/world/GrowthPeriod";
import { MonthCalendar } from "../components/world/MonthCalendar";
import { YearChart } from "../components/world/YearChart";
import { EmptyState } from "../components/ui/Card";
import { NaturePanel } from "../components/ui/NaturePanel";
import { Spinner } from "../components/ui/Icon";
import { recentDateKeys } from "../utils/date";
import { cx, formatPercent } from "../utils/helpers";
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
  const yearlyOverview = useYearlyOverview();

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
      <div className="ss-container max-w-5xl space-y-8 py-12">
        <GrowthHeader />
        <GrowthGarden snapshot={snapshot} history={history} domainShares={domainShares} />
        <EmptyState
          title="Your garden is ready for its first seeds"
          description="Once you've honoured a few rituals, plants start sprouting here and their pattern appears below."
        />
      </div>
    );
  }

  const recentKeys = new Set(recentDateKeys(RECENT_WINDOW_DAYS));
  const recentRituals = Object.entries(history)
    .filter(([date]) => recentKeys.has(date))
    .reduce((total, [, day]) => total + day.rituals, 0);

  const contributions = [
    profile ? { name: profile.displayName, contribution: world.contributions[profile.uid] } : null,
    partner ? { name: partner.displayName, contribution: world.contributions[partner.uid] } : null,
  ].filter((entry): entry is { name: string; contribution: (typeof world.contributions)[string] } =>
    Boolean(entry?.contribution),
  );

  return (
    <div className="ss-container max-w-5xl space-y-6 py-8 sm:space-y-8 sm:py-12 motion-safe:animate-(--animate-fade-in)">
      <GrowthHeader />

      <GrowthGarden snapshot={snapshot} history={history} domainShares={domainShares} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Harmony" value={formatPercent(snapshot.harmony)} tone="pink" />
        <Stat label="This month" value={`${recentRituals} rituals`} tone="amber" />
        <Stat label="Since the beginning" value={`${world.totalRituals} rituals`} tone="emerald" />
        <Stat label="Days you've shown up" value={String(world.activeDays)} tone="sky" />
      </div>

      <NaturePanel theme="lake" eyebrow="the last two weeks" title="The shared world, recently">
        <div className="rounded-3xl bg-white/75 p-5 shadow-soft dark:bg-white/5">
          <EnergyChart history={history} />
        </div>
      </NaturePanel>

      <NaturePanel theme="sunset" eyebrow="just you" title="Your own completion">
        <div className="rounded-3xl bg-white/75 p-5 shadow-soft dark:bg-white/5">
          <CompletionChart series={progressSeries} />
        </div>
      </NaturePanel>

      {!yearlyOverview.isLoading && yearlyOverview.points.some((point) => point.rituals > 0) ? (
        <NaturePanel
          theme="dusk"
          eyebrow="zoomed all the way out"
          title="The last year"
          description="Slow growth is still growth."
        >
          <div className="rounded-3xl bg-white/75 p-5 shadow-soft dark:bg-white/5">
            <YearChart points={yearlyOverview.points} />
          </div>
        </NaturePanel>
      ) : null}

      {contributions.length > 0 ? (
        <NaturePanel theme="blossom" eyebrow="side by side" title="How you've both been showing up">
          <div className="space-y-4 rounded-3xl bg-white/75 p-5 shadow-soft dark:bg-white/5">
            {contributions.map(({ name, contribution }, index) => (
              <div key={name}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-display text-base font-semibold text-ink">{name}</span>
                  <span className="text-ink-faint">
                    {contribution.rituals} {contribution.rituals === 1 ? "ritual" : "rituals"} ·{" "}
                    {contribution.activeDays} {contribution.activeDays === 1 ? "day" : "days"}
                  </span>
                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-pink-100 dark:bg-pink-950">
                  <div
                    className={cx(
                      "h-full rounded-full bg-linear-to-r",
                      index === 0 ? "from-pink-400 to-rose-500" : "from-sky-400 to-indigo-500",
                    )}
                    style={{
                      width: `${Math.min(100, Math.round((contribution.energy / Math.max(1, world.totalEnergy)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </NaturePanel>
      ) : null}

      <NaturePanel theme="meadow">
        <MonthCalendar />
      </NaturePanel>

      <GrowthPeriod />
    </div>
  );
}

function GrowthHeader() {
  return (
    <header>
      <p className="ss-hand text-2xl text-emerald-600 dark:text-emerald-300">watch yourself bloom</p>
      <h1 className="ss-gradient-text font-display text-5xl font-bold sm:text-6xl">Growth</h1>
      <p className="mt-2 max-w-prose text-[0.95rem] text-ink-soft">
        Your garden, your rhythms and your seasons, all in one place.
      </p>
    </header>
  );
}

const STAT_TONES = {
  pink: "from-pink-200 to-rose-100 dark:from-pink-950 dark:to-rose-950/60",
  amber: "from-amber-200 to-yellow-100 dark:from-amber-950 dark:to-yellow-950/60",
  emerald: "from-emerald-200 to-lime-100 dark:from-emerald-950 dark:to-lime-950/60",
  sky: "from-sky-200 to-cyan-100 dark:from-sky-950 dark:to-cyan-950/60",
} as const;

function Stat({ label, value, tone }: { label: string; value: string; tone: keyof typeof STAT_TONES }) {
  return (
    <div
      className={cx(
        "rounded-3xl border-2 border-white/70 bg-linear-to-br p-5 shadow-soft transition-transform hover:-translate-y-1 dark:border-white/10",
        STAT_TONES[tone],
      )}
    >
      <p className="text-xs font-bold text-ink-soft">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
