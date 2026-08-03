import { useEffect, useState } from "react";

import type { WorldEvent } from "../types/world";
import { subscribeToTimeline } from "../services/timeline";
import { useWorldStore } from "../store/worldStore";

export function useTimeline(): WorldEvent[] {
  const pair = useWorldStore((state) => state.pair);
  const [events, setEvents] = useState<WorldEvent[]>([]);

  useEffect(() => {
    if (!pair?.worldId) return;

    return subscribeToTimeline(pair.worldId, setEvents);
  }, [pair?.worldId]);

  return events;
}
