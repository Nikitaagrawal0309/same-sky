/**
 * The shared journal.
 *
 * The journal is shared, but authorship is not. Each partner writes in their
 * own space and both can read everything; an entry can only ever be edited by
 * the person who wrote it. Entries never overwrite or merge — over years, the
 * journal becomes a diary written in two hands.
 */

/**
 * How a day felt. Deliberately non-evaluative: there is no "good" mood here
 * and nothing is ever scored, trended against a target, or shown as a decline.
 */
export type JournalMood = "bright" | "warm" | "steady" | "tender" | "heavy";

export interface JournalEntry {
  id: string;

  worldId: string;

  authorUid: string;

  /** The author's local calendar day, `YYYY-MM-DD`. */
  date: string;

  title: string | null;

  body: string;

  mood: JournalMood | null;

  createdAt: number;

  updatedAt: number;
}

export interface JournalMoodDefinition {
  id: JournalMood;

  label: string;

  /** A short, accepting description shown beside the label. */
  description: string;
}

/**
 * Every mood is offered with equal weight and equal warmth.
 */
export const JOURNAL_MOODS: readonly JournalMoodDefinition[] = [
  { id: "bright", label: "Bright", description: "Today had light in it." },
  { id: "warm", label: "Warm", description: "Something felt close today." },
  { id: "steady", label: "Steady", description: "An ordinary, level day." },
  { id: "tender", label: "Tender", description: "Today asked for gentleness." },
  { id: "heavy", label: "Heavy", description: "Today was hard, and that is allowed." },
];
