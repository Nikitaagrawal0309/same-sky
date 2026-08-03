import { PATHS } from "../app/constants";
import type { WorldEvent, WorldEventType } from "../types/world";
import { recordToArray } from "../utils/helpers";
import { todayKey } from "../utils/date";
import { getData, reserveChildKey, setData, subscribe } from "./database";

/**
 * The historical timeline.
 *
 * A permanent record of the moments that actually mark a shared journey —
 * never a log of every action taken. Honouring a ritual does not belong here;
 * it is too frequent to be a moment, and turning it into one would make the
 * timeline noisy rather than meaningful. What belongs here: the world's own
 * milestones, memories, and journal entries — the things a pair would
 * actually want to scroll back through years later.
 */

export interface RecordEventPayload {
  worldId: string;
  type: WorldEventType;
  uid: string | null;
  title: string;
  detail: string | null;
  date?: string;
}

export async function recordEvent({
  worldId,
  type,
  uid,
  title,
  detail,
  date = todayKey(),
}: RecordEventPayload): Promise<WorldEvent> {
  const id = reserveChildKey(PATHS.timeline(worldId));

  const event: WorldEvent = {
    id,
    type,
    worldId,
    uid,
    title,
    detail,
    date,
    createdAt: Date.now(),
  };

  await setData(PATHS.timelineEvent(worldId, id), event);

  return event;
}

export async function getTimeline(worldId: string): Promise<WorldEvent[]> {
  const events = await getData<Record<string, WorldEvent>>(PATHS.timeline(worldId));

  return recordToArray(events).sort((a, b) => b.createdAt - a.createdAt);
}

export function subscribeToTimeline(
  worldId: string,
  callback: (events: WorldEvent[]) => void,
): () => void {
  return subscribe<Record<string, WorldEvent>>(PATHS.timeline(worldId), (events) => {
    callback(recordToArray(events).sort((a, b) => b.createdAt - a.createdAt));
  });
}
