import { useEffect, useState } from "react";

import type { JournalEntry, JournalMood } from "../types/journal";
import {
  createJournalEntry,
  subscribeToJournal,
  updateJournalEntry,
} from "../services/journal";
import { useWorldStore } from "../store/worldStore";
import { useUid } from "./useAuth";

export interface JournalDraft {
  title: string | null;
  body: string;
  mood: JournalMood | null;
}

export interface JournalControls {
  entries: JournalEntry[];
  create: (draft: JournalDraft) => Promise<void>;
  update: (entryId: string, draft: JournalDraft) => Promise<void>;
}

/**
 * The shared journal, live.
 *
 * A live listener is worth it here: seeing your partner's entry appear the
 * evening they write it is most of what makes the journal feel shared rather
 * than like two separate diaries that happen to live in one place.
 */
export function useJournal(): JournalControls {
  const pair = useWorldStore((state) => state.pair);
  const today = useWorldStore((state) => state.today);
  const uid = useUid();

  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (!pair?.worldId) return;

    return subscribeToJournal(pair.worldId, setEntries);
  }, [pair?.worldId]);

  return {
    entries,

    create: async (draft) => {
      if (!pair?.worldId || !uid) return;

      await createJournalEntry({ worldId: pair.worldId, uid, date: today, ...draft });
    },

    update: async (entryId, draft) => {
      if (!pair?.worldId || !uid) return;

      await updateJournalEntry(pair.worldId, entryId, uid, draft);
    },
  };
}
