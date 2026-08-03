import { PATHS } from "../app/constants";
import type { DailyNote, NoteVessel } from "../types/note";
import { getData, setData, subscribe, updateData } from "./database";
import { normaliseText } from "../utils/helpers";
import { validateNote } from "../utils/validators";

/**
 * Daily notes.
 *
 * One short note, once a day, per person. The scarcity is the point: this is
 * not a chat thread, and there is no history of notes to scroll back through —
 * only ever today's, waiting to be found. Once a day has closed its note is
 * simply part of that day; nothing here lets it be edited afterwards.
 */

export async function getNote(
  worldId: string,
  date: string,
  uid: string,
): Promise<DailyNote | null> {
  return getData<DailyNote>(PATHS.note(worldId, date, uid));
}

export function subscribeToNotesForDay(
  worldId: string,
  date: string,
  callback: (notes: Record<string, DailyNote>) => void,
): () => void {
  return subscribe<Record<string, DailyNote>>(PATHS.notesForDay(worldId, date), (notes) => {
    callback(notes ?? {});
  });
}

export interface LeaveNotePayload {
  worldId: string;
  uid: string;
  date: string;
  body: string;
  vessel: NoteVessel;
}

/**
 * Leave today's note.
 *
 * Writing again the same day replaces the note rather than adding a second
 * one — there is exactly one per person, per day, by design.
 */
export async function leaveNote({
  worldId,
  uid,
  date,
  body,
  vessel,
}: LeaveNotePayload): Promise<DailyNote> {
  const validation = validateNote(body);

  if (!validation.isValid) {
    throw new Error(validation.message ?? "That note could not be sent.");
  }

  const existing = await getNote(worldId, date, uid);

  const note: DailyNote = {
    id: uid,
    worldId,
    authorUid: uid,
    date,
    body: normaliseText(body),
    vessel,
    createdAt: existing?.createdAt ?? Date.now(),
    openedAt: null,
  };

  await setData(PATHS.note(worldId, date, uid), note);

  return note;
}

/**
 * Mark a note as found. Idempotent — opening an already-opened note changes
 * nothing, so the moment of discovery is recorded once and stays true.
 */
export async function openNote(worldId: string, date: string, uid: string): Promise<void> {
  const note = await getNote(worldId, date, uid);

  if (!note || note.openedAt !== null) return;

  await updateData<DailyNote>(PATHS.note(worldId, date, uid), { openedAt: Date.now() });
}
