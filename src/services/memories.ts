import { PATHS } from "../app/constants";
import type { Memory, MemoryImage, MemoryKind } from "../types/memory";
import { normaliseText, recordToArray } from "../utils/helpers";
import { validateMemory } from "../utils/validators";
import { getData, reserveChildKey, setData, subscribe } from "./database";
import { recordEvent } from "./timeline";

/**
 * Memories.
 *
 * Never a gallery to browse and forget: every memory saved here also becomes
 * a permanent entry on the pair's timeline. Nothing here is ever deleted
 * automatically, and there is deliberately no bulk-delete or archive action —
 * removing a memory is a decision, not a cleanup step.
 */

export interface SaveMemoryPayload {
  worldId: string;
  uid: string;
  title: string;
  story: string | null;
  date: string;
  kind: MemoryKind;
  image: MemoryImage | null;
}

export async function saveMemory({
  worldId,
  uid,
  title,
  story,
  date,
  kind,
  image,
}: SaveMemoryPayload): Promise<Memory> {
  const validation = validateMemory(title);

  if (!validation.isValid) {
    throw new Error(validation.message ?? "That memory could not be saved.");
  }

  const id = reserveChildKey(PATHS.memories(worldId));
  const now = Date.now();

  const memory: Memory = {
    id,
    worldId,
    authorUid: uid,
    title: normaliseText(title),
    story: story ? normaliseText(story) : null,
    date,
    kind,
    image,
    createdAt: now,
    updatedAt: now,
  };

  await setData(PATHS.memory(worldId, id), memory);

  await recordEvent({
    worldId,
    type: "memory-saved",
    uid,
    title: memory.title,
    detail: memory.story,
    date,
  });

  return memory;
}

export async function getMemories(worldId: string): Promise<Memory[]> {
  const memories = await getData<Record<string, Memory>>(PATHS.memories(worldId));

  return recordToArray(memories).sort((a, b) => b.date.localeCompare(a.date));
}

export function subscribeToMemories(
  worldId: string,
  callback: (memories: Memory[]) => void,
): () => void {
  return subscribe<Record<string, Memory>>(PATHS.memories(worldId), (memories) => {
    callback(recordToArray(memories).sort((a, b) => b.date.localeCompare(a.date)));
  });
}
