import { useEffect, useState } from "react";

import type { DailyNote, NoteVessel } from "../types/note";
import { getPartnerUid } from "../services/pair";
import { leaveNote, openNote, subscribeToNotesForDay } from "../services/notes";
import { useWorldStore } from "../store/worldStore";
import { useUid } from "./useAuth";

/**
 * Today's notes.
 *
 * A thin, self-contained subscription rather than a slice of the world store:
 * notes are scoped to a single day and read far less often than the ritual
 * ledger, so they do not need to live in a store every screen re-subscribes
 * to.
 */
export interface TodayNotes {
  mine: DailyNote | null;
  fromPartner: DailyNote | null;
  send: (body: string, vessel: NoteVessel) => Promise<void>;
  open: () => Promise<void>;
}

export function useTodayNotes(): TodayNotes {
  const pair = useWorldStore((state) => state.pair);
  const date = useWorldStore((state) => state.today);
  const uid = useUid();

  const [notes, setNotes] = useState<Record<string, DailyNote>>({});

  useEffect(() => {
    if (!pair?.worldId) return;

    return subscribeToNotesForDay(pair.worldId, date, setNotes);
  }, [pair?.worldId, date]);

  const partnerUid = pair && uid ? getPartnerUid(pair, uid) : null;

  return {
    mine: (uid && notes[uid]) || null,
    fromPartner: (partnerUid && notes[partnerUid]) || null,

    send: async (body, vessel) => {
      if (!pair?.worldId || !uid) return;

      await leaveNote({ worldId: pair.worldId, uid, date, body, vessel });
    },

    open: async () => {
      if (!pair?.worldId || !partnerUid) return;

      await openNote(pair.worldId, date, partnerUid);
    },
  };
}
