/**
 * Memories — moments a pair chooses to keep.
 *
 * A memory is not a gallery item. Every memory is placed on the permanent
 * timeline and, once the world is old enough to hold them, becomes part of the
 * world itself. Memories are never deleted automatically and never expire.
 */

export type MemoryKind =
  /** An ordinary moment worth keeping. */
  | "moment"
  /** A first: a first trip, a first home, a first anything. */
  | "first"
  /** A place that matters. */
  | "place"
  /** A milestone in the shared journey. */
  | "milestone";

export interface MemoryImage {
  /**
   * The image itself.
   *
   * Images are downscaled and encoded by `services/storage.ts` before they are
   * stored, which keeps a memory small enough to live alongside its text and
   * avoids depending on any service the project has not been granted.
   */
  data: string;

  width: number;

  height: number;

  /** Encoded size in bytes, recorded so growth stays observable. */
  bytes: number;
}

export interface Memory {
  id: string;

  worldId: string;

  /** Who saved it. Either partner may save a memory; both can always see it. */
  authorUid: string;

  title: string;

  /** The story behind the moment. Optional — a title is enough. */
  story: string | null;

  /**
   * The local calendar day the memory is *about*, which is often not the day
   * it was saved. `YYYY-MM-DD`.
   */
  date: string;

  kind: MemoryKind;

  image: MemoryImage | null;

  createdAt: number;

  updatedAt: number;
}

export interface MemoryKindDefinition {
  id: MemoryKind;

  label: string;

  description: string;
}

export const MEMORY_KINDS: readonly MemoryKindDefinition[] = [
  { id: "moment", label: "A moment", description: "Something small worth keeping." },
  { id: "first", label: "A first", description: "The first time you did this." },
  { id: "place", label: "A place", description: "Somewhere that matters to you both." },
  { id: "milestone", label: "A milestone", description: "A marker in your shared journey." },
];

/**
 * The longest edge an image is scaled to before storage. Large enough to look
 * beautiful on a high-density screen, small enough that a lifetime of memories
 * stays light.
 */
export const MEMORY_IMAGE_MAX_EDGE = 1400;
