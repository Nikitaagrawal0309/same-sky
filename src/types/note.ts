/**
 * Daily notes — one short message each partner may leave per day.
 *
 * A note is deliberately scarce. Same Sky is not a messaging application, and
 * the single-note-per-day limit is a feature: it makes the note matter. Notes
 * do not arrive as alerts; they wait somewhere in the shared world to be
 * found, the way a letter left on a table is found.
 */

/**
 * The object a note takes in the world. Chosen by the author, purely for
 * feeling — every vessel behaves identically.
 */
export type NoteVessel = "letter" | "gift" | "lantern" | "feather" | "stone";

export interface DailyNote {
  id: string;

  worldId: string;

  authorUid: string;

  /** The author's local calendar day, `YYYY-MM-DD`. */
  date: string;

  /** The note itself. Short by design — see `NOTE_MAX_LENGTH`. */
  body: string;

  vessel: NoteVessel;

  createdAt: number;

  /** When the partner opened it, or `null` while it is still waiting. */
  openedAt: number | null;
}

/**
 * Notes are meant to be read in a single breath, not scrolled.
 */
export const NOTE_MAX_LENGTH = 280;
