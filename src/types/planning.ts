/**
 * Planning and reflection.
 *
 * A plan states what two people hope to tend to. A reflection describes what
 * actually happened. The two are compared, but never as a score — the purpose
 * is awareness, not performance. Reflections must be able to describe a week
 * in which almost nothing happened without ever implying failure.
 */

import type { RitualDomain, RitualId } from "./ritual";

export type PlanPeriod = "week" | "month";

/**
 * A single thing a pair intends to tend to during a period.
 *
 * Intentions are not tasks. They are never marked complete or incomplete by
 * hand; where an intention names a ritual, the reflection observes how that
 * ritual actually went and says so kindly.
 */
export interface PlanIntention {
  id: string;

  /** Written in the author's own words. */
  text: string;

  authorUid: string;

  /** The ritual this intention is about, when it is about one. */
  ritualId: RitualId | null;

  /** `true` when both partners are tending to this together. */
  isShared: boolean;

  createdAt: number;
}

/**
 * Stored at `plans/{worldId}/{periodKey}`, where `periodKey` is an ISO week
 * (`2026-W31`) or a calendar month (`2026-08`).
 */
export interface Plan {
  id: string;

  worldId: string;

  period: PlanPeriod;

  periodKey: string;

  /** First local calendar day covered, inclusive. */
  startDate: string;

  /** Last local calendar day covered, inclusive. */
  endDate: string;

  intentions: Record<string, PlanIntention>;

  createdAt: number;

  updatedAt: number;
}

/* -------------------------------------------------------------------------
   Reflection
   ------------------------------------------------------------------------- */

export interface PartnerPeriodSummary {
  uid: string;

  rituals: number;

  energy: number;

  activeDays: number;
}

export interface ReflectionSummary {
  totalRituals: number;

  totalEnergy: number;

  /** Days in the period on which at least one partner honoured a ritual. */
  activeDays: number;

  /** Days in the period on which both partners honoured something. */
  sharedDays: number;

  /** Total days in the period that have already happened. */
  daysElapsed: number;

  /**
   * Rituals honoured as a share of rituals intended, 0–1.
   *
   * Presented as "how the week went", never as a grade. A low number is
   * described as a quiet week, because that is what it is.
   */
  completion: number;

  ritualsByDomain: Record<RitualDomain, number>;

  byPartner: Record<string, PartnerPeriodSummary>;

  /** The ritual honoured most often in this period, if any were. */
  steadiestRitual: RitualId | null;

  /** The ritual that grew most compared with the previous period, if any. */
  mostImprovedRitual: RitualId | null;
}

/**
 * The voice an observation is written in. Tone exists so the interface can
 * present observations with matching warmth, and so no observation can be
 * rendered as a warning.
 */
export type ReflectionTone = "growth" | "steady" | "together" | "gentle";

export interface ReflectionObservation {
  id: string;

  tone: ReflectionTone;

  title: string;

  detail: string;
}

/**
 * Stored at `reflections/{worldId}/{periodKey}`.
 *
 * Reflections are generated from stored history, so any past period can be
 * regenerated at any time — including years later.
 */
export interface Reflection {
  id: string;

  worldId: string;

  period: PlanPeriod;

  periodKey: string;

  startDate: string;

  endDate: string;

  generatedAt: number;

  summary: ReflectionSummary;

  observations: ReflectionObservation[];

  /**
   * A single, optional invitation toward the next period. Phrased as an open
   * question rather than an instruction, and always safe to ignore.
   */
  invitation: string;
}

/* -------------------------------------------------------------------------
   Analysis series
   ------------------------------------------------------------------------- */

/**
 * One point on a progress chart.
 *
 * `honoured` and `intended` are both carried so completion can be shown as a
 * proportion without the chart having to recompute it.
 */
export interface ProgressPoint {
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;

  /** Short axis label, already localised — "Mon", "12". */
  label: string;

  honoured: number;

  intended: number;

  /** `honoured / intended`, clamped to 0–1. `0` when nothing was intended. */
  completion: number;

  energy: number;

  /** `true` when this point is in the future and therefore not yet lived. */
  isFuture: boolean;
}

export interface ProgressSeries {
  period: PlanPeriod;

  periodKey: string;

  points: ProgressPoint[];

  /** Mean completion across the days that have already happened, 0–1. */
  averageCompletion: number;
}

/**
 * A single slice of the domain breakdown, ready to render.
 */
export interface DomainShare {
  domain: RitualDomain;

  label: string;

  count: number;

  /** Share of all rituals honoured in the period, 0–1. */
  share: number;
}
