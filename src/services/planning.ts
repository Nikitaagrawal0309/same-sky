import { PATHS } from "../app/constants";
import type { RitualDomain, RitualEntry, RitualId } from "../types/ritual";
import type {
  DomainShare,
  PartnerPeriodSummary,
  Plan,
  PlanIntention,
  PlanPeriod,
  ProgressPoint,
  ProgressSeries,
  Reflection,
  ReflectionObservation,
  ReflectionSummary,
} from "../types/planning";
import {
  RITUAL_DOMAIN_LABELS,
  RITUAL_DOMAIN_ORDER,
  getRitual,
  getRituals,
} from "./ritual";
import {
  addDays,
  eachDateKey,
  formatDayOfMonth,
  formatWeekdayShort,
  fromDateKey,
  periodRange,
  toMonthKey,
  toWeekKey,
  todayKey,
} from "../utils/date";
import { average, clamp01, groupBy, normaliseText, round, sum } from "../utils/helpers";
import { getData, reserveChildKey, setData, subscribe, updateData } from "./database";

/**
 * Planning and reflection.
 *
 * A plan is a short list of intentions a pair writes down for a week or a
 * month — never tasks, never checked off. A reflection is generated entirely
 * from ritual history, the same way `deriveWorld` generates the shared world:
 * nothing about a reflection is stored, so any past period can be regenerated,
 * and tuning how a reflection reads never requires migrating old data.
 */

/* -------------------------------------------------------------------------
   Plans
   ------------------------------------------------------------------------- */

function emptyPlan(worldId: string, period: PlanPeriod, periodKey: string): Plan {
  const { start, end } = periodRange(periodKey);
  const now = Date.now();

  return {
    id: periodKey,
    worldId,
    period,
    periodKey,
    startDate: start,
    endDate: end,
    intentions: {},
    createdAt: now,
    updatedAt: now,
  };
}

export async function getPlan(
  worldId: string,
  period: PlanPeriod,
  periodKey: string,
): Promise<Plan> {
  const stored = await getData<Plan>(PATHS.plan(worldId, periodKey));

  return stored ?? emptyPlan(worldId, period, periodKey);
}

export function subscribeToPlan(
  worldId: string,
  period: PlanPeriod,
  periodKey: string,
  callback: (plan: Plan) => void,
): () => void {
  return subscribe<Plan>(PATHS.plan(worldId, periodKey), (plan) => {
    callback(plan ?? emptyPlan(worldId, period, periodKey));
  });
}

export interface AddIntentionPayload {
  worldId: string;
  period: PlanPeriod;
  periodKey: string;
  authorUid: string;
  text: string;
  ritualId: RitualId | null;
  isShared: boolean;
}

/**
 * Add an intention to a plan, creating the plan itself on its first one.
 */
export async function addIntention({
  worldId,
  period,
  periodKey,
  authorUid,
  text,
  ritualId,
  isShared,
}: AddIntentionPayload): Promise<Plan> {
  const plan = await getPlan(worldId, period, periodKey);

  const intentionId = reserveChildKey(PATHS.plan(worldId, periodKey));

  const intention: PlanIntention = {
    id: intentionId,
    text: normaliseText(text),
    authorUid,
    ritualId,
    isShared,
    createdAt: Date.now(),
  };

  const updated: Plan = {
    ...plan,
    intentions: { ...plan.intentions, [intentionId]: intention },
    updatedAt: Date.now(),
  };

  await setData(PATHS.plan(worldId, periodKey), updated);

  return updated;
}

/**
 * Remove an intention. Restricted to whoever wrote it — a shared plan is
 * still made of individually authored lines, and only the author retracts
 * their own.
 */
export async function removeIntention(
  worldId: string,
  periodKey: string,
  intentionId: string,
  requestingUid: string,
): Promise<void> {
  const plan = await getData<Plan>(PATHS.plan(worldId, periodKey));
  const intention = plan?.intentions?.[intentionId];

  if (!plan || !intention) return;

  if (intention.authorUid !== requestingUid) {
    throw new Error("Only the person who wrote this can remove it.");
  }

  const remaining = Object.fromEntries(
    Object.entries(plan.intentions).filter(([id]) => id !== intentionId),
  );

  await updateData<Plan>(PATHS.plan(worldId, periodKey), {
    intentions: remaining,
    updatedAt: Date.now(),
  });
}

/**
 * The period immediately before `periodKey`, in the same key format.
 *
 * Used only to fetch the comparison entries a reflection needs for its
 * "most improved" observation.
 */
export function previousPeriodKey(period: PlanPeriod, periodKey: string): string {
  const { start } = periodRange(periodKey);

  if (period === "week") {
    return toWeekKey(addDays(fromDateKey(start), -7));
  }

  const [year, month] = periodKey.split("-").map(Number);

  return toMonthKey(new Date(year, month - 2, 1));
}

/* -------------------------------------------------------------------------
   Reflection
   ------------------------------------------------------------------------- */

/**
 * Summarise a period from its ritual entries alone.
 *
 * Pure and synchronous, exactly like `deriveWorld` — it never touches the
 * network, so a screen can regenerate the reflection for any past week or
 * month the moment its entries are loaded.
 */
export function summarisePeriod(
  entries: RitualEntry[],
  partnerUids: string[],
  startDate: string,
  endDate: string,
  intentionsCount: number,
  previousEntries: RitualEntry[] = [],
): ReflectionSummary {
  const today = todayKey();
  const lastElapsedDate = endDate < today ? endDate : today;
  const daysElapsed = Math.max(0, eachDateKey(startDate, lastElapsedDate).length);

  const byDate = groupBy(entries, (entry) => entry.date);
  const activeDays = Object.keys(byDate).length;

  const sharedDays = Object.values(byDate).filter((day) => {
    const uidsThatDay = new Set(day.map((entry) => entry.uid));
    return uidsThatDay.size >= 2;
  }).length;

  const ritualsByDomain = Object.fromEntries(
    RITUAL_DOMAIN_ORDER.map((domain) => [domain, 0]),
  ) as Record<RitualDomain, number>;

  for (const entry of entries) {
    const definition = getRitual(entry.ritualId);
    if (definition) ritualsByDomain[definition.domain] += 1;
  }

  const byPartner: Record<string, PartnerPeriodSummary> = {};

  for (const uid of partnerUids) {
    const mine = entries.filter((entry) => entry.uid === uid);

    byPartner[uid] = {
      uid,
      rituals: mine.length,
      energy: round(sum(mine.map((entry) => entry.energy))),
      activeDays: new Set(mine.map((entry) => entry.date)).size,
    };
  }

  const byRitual = groupBy(entries, (entry) => entry.ritualId);
  const steadiestRitual =
    (Object.entries(byRitual).sort((a, b) => b[1].length - a[1].length)[0]?.[0] as
      | RitualId
      | undefined) ?? null;

  let mostImprovedRitual: RitualId | null = null;

  if (previousEntries.length > 0) {
    const previousByRitual = groupBy(previousEntries, (entry) => entry.ritualId);
    let bestGrowth = 0;

    for (const [ritualId, current] of Object.entries(byRitual) as Array<
      [RitualId, RitualEntry[]]
    >) {
      const growth = current.length - (previousByRitual[ritualId]?.length ?? 0);

      if (growth > bestGrowth) {
        bestGrowth = growth;
        mostImprovedRitual = ritualId as RitualId;
      }
    }
  }

  /*
    Completion is measured against how many rituals were actually intended —
    either named directly in the plan, or (when nothing was planned) simply
    one honest attempt per elapsed day, so a period with no plan at all still
    reads as a meaningful proportion rather than an automatic zero.
  */
  const possible = Math.max(1, intentionsCount) * Math.max(1, daysElapsed);
  const completion = clamp01(entries.length / possible);

  return {
    totalRituals: entries.length,
    totalEnergy: round(sum(entries.map((entry) => entry.energy))),
    activeDays,
    sharedDays,
    daysElapsed,
    completion,
    ritualsByDomain,
    byPartner,
    steadiestRitual,
    mostImprovedRitual,
  };
}

function buildObservations(
  summary: ReflectionSummary,
  partnerUids: string[],
): ReflectionObservation[] {
  const observations: ReflectionObservation[] = [];

  if (summary.totalRituals === 0) {
    observations.push({
      id: "quiet",
      tone: "gentle",
      title: "A quiet stretch",
      detail:
        "Nothing was recorded this period, and that's simply what it was. Coming back is always easier than starting over.",
    });

    return observations;
  }

  if (partnerUids.length >= 2 && summary.sharedDays > 0) {
    observations.push({
      id: "together",
      tone: "together",
      title: `${summary.sharedDays} ${summary.sharedDays === 1 ? "day" : "days"} together`,
      detail:
        summary.sharedDays >= summary.activeDays * 0.5
          ? "More often than not, you were both showing up on the same days."
          : "There were days you were both here at once — those are worth noticing.",
    });
  }

  if (summary.steadiestRitual) {
    const definition = getRitual(summary.steadiestRitual);

    if (definition) {
      observations.push({
        id: "steadiest",
        tone: "steady",
        title: definition.label,
        detail: `This was the ritual you returned to most this period.`,
      });
    }
  }

  if (summary.mostImprovedRitual) {
    const definition = getRitual(summary.mostImprovedRitual);

    if (definition) {
      observations.push({
        id: "improved",
        tone: "growth",
        title: `More ${definition.label.toLowerCase()}`,
        detail: "You returned to this more than you did the period before.",
      });
    }
  }

  if (observations.length === 0) {
    observations.push({
      id: "steady",
      tone: "steady",
      title: "A steady period",
      detail: `${summary.totalRituals} ${summary.totalRituals === 1 ? "ritual" : "rituals"} honoured, at your own pace.`,
    });
  }

  return observations;
}

function buildInvitation(summary: ReflectionSummary): string {
  if (summary.totalRituals === 0) {
    return "Is there one small thing worth returning to first?";
  }

  if (summary.steadiestRitual) {
    const definition = getRitual(summary.steadiestRitual);
    return definition
      ? `Worth carrying ${definition.label.toLowerCase()} into the next one?`
      : "What would you like to carry into the next period?";
  }

  return "What would you like the next period to hold?";
}

export interface GenerateReflectionOptions {
  worldId: string;
  period: PlanPeriod;
  periodKey: string;
  entries: RitualEntry[];
  previousEntries?: RitualEntry[];
  partnerUids: string[];
  intentionsCount: number;
}

/**
 * Generate a reflection for a period, entirely from what actually happened.
 */
export function generateReflection({
  worldId,
  period,
  periodKey,
  entries,
  previousEntries = [],
  partnerUids,
  intentionsCount,
}: GenerateReflectionOptions): Reflection {
  const { start, end } = periodRange(periodKey);

  const summary = summarisePeriod(
    entries,
    partnerUids,
    start,
    end,
    intentionsCount,
    previousEntries,
  );

  return {
    id: periodKey,
    worldId,
    period,
    periodKey,
    startDate: start,
    endDate: end,
    generatedAt: Date.now(),
    summary,
    observations: buildObservations(summary, partnerUids),
    invitation: buildInvitation(summary),
  };
}

/* -------------------------------------------------------------------------
   Charts
   ------------------------------------------------------------------------- */

/**
 * A day-by-day completion series for one person's own chosen practice.
 *
 * Deliberately personal rather than shared: "intended" only has meaning
 * against a practice someone actually chose, and the two partners' practices
 * can be entirely different sizes and shapes.
 */
export function buildProgressSeries(
  entries: RitualEntry[],
  practiceRitualIds: RitualId[],
  startDate: string,
  endDate: string,
  period: PlanPeriod = "week",
): ProgressSeries {
  const dailyRituals = getRituals(practiceRitualIds).filter(
    (ritual) => ritual.cadence === "daily",
  );
  const intended = dailyRituals.length;

  const byDate = groupBy(entries, (entry) => entry.date);
  const today = todayKey();

  const points: ProgressPoint[] = eachDateKey(startDate, endDate).map((date) => {
    const dayEntries = byDate[date] ?? [];

    const honoured = dayEntries.filter((entry) =>
      dailyRituals.some((ritual) => ritual.id === entry.ritualId),
    ).length;

    return {
      date,
      label: endDate === startDate ? formatWeekdayShort(date) : formatDayOfMonth(date),
      honoured,
      intended,
      completion: intended > 0 ? clamp01(honoured / intended) : 0,
      energy: round(sum(dayEntries.map((entry) => entry.energy))),
      isFuture: date > today,
    };
  });

  const lived = points.filter((point) => !point.isFuture && point.intended > 0);

  return {
    period,
    periodKey: startDate,
    points,
    averageCompletion: average(lived.map((point) => point.completion)),
  };
}

export function buildDomainShares(entries: RitualEntry[]): DomainShare[] {
  const total = entries.length;

  const counts = Object.fromEntries(
    RITUAL_DOMAIN_ORDER.map((domain) => [domain, 0]),
  ) as Record<RitualDomain, number>;

  for (const entry of entries) {
    const definition = getRitual(entry.ritualId);
    if (definition) counts[definition.domain] += 1;
  }

  return RITUAL_DOMAIN_ORDER.map((domain) => ({
    domain,
    label: RITUAL_DOMAIN_LABELS[domain],
    count: counts[domain],
    share: total > 0 ? clamp01(counts[domain] / total) : 0,
  })).filter((share) => share.count > 0);
}
