import { PATHS } from "../app/constants";
import type { JournalEntry, JournalMood } from "../types/journal";
import { normaliseText, recordToArray } from "../utils/helpers";
import { validateJournalEntry } from "../utils/validators";
import { getData, reserveChildKey, setData, subscribe } from "./database";
import { recordEvent } from "./timeline";

/**
 * The shared journal.
 *
 * Shared to read, private to write: both partners see every entry, but an
 * entry can only ever be changed by the person who wrote it. That rule is
 * enforced here as well as in storage rules, so a future caller cannot forget
 * it by going through a different code path.
 */

export interface WriteJournalEntryPayload {
  worldId: string;
  uid: string;
  date: string;
  title: string | null;
  body: string;
  mood: JournalMood | null;
}

export async function createJournalEntry({
  worldId,
  uid,
  date,
  title,
  body,
  mood,
}: WriteJournalEntryPayload): Promise<JournalEntry> {
  const validation = validateJournalEntry(body, title);

  if (!validation.isValid) {
    throw new Error(validation.message ?? "That entry could not be saved.");
  }

  const id = reserveChildKey(PATHS.journal(worldId));
  const now = Date.now();

  const entry: JournalEntry = {
    id,
    worldId,
    authorUid: uid,
    date,
    title: title ? normaliseText(title) : null,
    body: normaliseText(body),
    mood,
    createdAt: now,
    updatedAt: now,
  };

  await setData(PATHS.journalEntry(worldId, id), entry);

  await recordEvent({
    worldId,
    type: "journal-entry",
    uid,
    title: entry.title ?? "A new page",
    detail: null,
    date,
  });

  return entry;
}

/**
 * Update an entry. Restricted to its own author — passing a different uid
 * throws rather than silently doing nothing, since that would otherwise be a
 * quiet way to lose someone's edit.
 */
export async function updateJournalEntry(
  worldId: string,
  entryId: string,
  uid: string,
  changes: { title: string | null; body: string; mood: JournalMood | null },
): Promise<JournalEntry> {
  const existing = await getData<JournalEntry>(PATHS.journalEntry(worldId, entryId));

  if (!existing) {
    throw new Error("This entry no longer exists.");
  }

  if (existing.authorUid !== uid) {
    throw new Error("Only the person who wrote this entry can change it.");
  }

  const validation = validateJournalEntry(changes.body, changes.title);

  if (!validation.isValid) {
    throw new Error(validation.message ?? "That entry could not be saved.");
  }

  const updated: JournalEntry = {
    ...existing,
    title: changes.title ? normaliseText(changes.title) : null,
    body: normaliseText(changes.body),
    mood: changes.mood,
    updatedAt: Date.now(),
  };

  await setData(PATHS.journalEntry(worldId, entryId), updated);

  return updated;
}

export async function getJournalEntries(worldId: string): Promise<JournalEntry[]> {
  const entries = await getData<Record<string, JournalEntry>>(PATHS.journal(worldId));

  return recordToArray(entries).sort((a, b) => b.createdAt - a.createdAt);
}

export function subscribeToJournal(
  worldId: string,
  callback: (entries: JournalEntry[]) => void,
): () => void {
  return subscribe<Record<string, JournalEntry>>(PATHS.journal(worldId), (entries) => {
    callback(recordToArray(entries).sort((a, b) => b.createdAt - a.createdAt));
  });
}
