import { useEffect, useState } from "react";

import type { Memory, MemoryImage, MemoryKind } from "../types/memory";
import { saveMemory, subscribeToMemories } from "../services/memories";
import { useWorldStore } from "../store/worldStore";
import { useUid } from "./useAuth";

export interface MemoryDraft {
  title: string;
  story: string | null;
  date: string;
  kind: MemoryKind;
  image: MemoryImage | null;
}

export interface MemoriesControls {
  memories: Memory[];
  save: (draft: MemoryDraft) => Promise<void>;
}

export function useMemories(): MemoriesControls {
  const pair = useWorldStore((state) => state.pair);
  const uid = useUid();

  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    if (!pair?.worldId) return;

    return subscribeToMemories(pair.worldId, setMemories);
  }, [pair?.worldId]);

  return {
    memories,

    save: async (draft) => {
      if (!pair?.worldId || !uid) return;

      await saveMemory({ worldId: pair.worldId, uid, ...draft });
    },
  };
}
