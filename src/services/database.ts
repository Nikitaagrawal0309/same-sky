import {
  endAt,
  get,
  onValue,
  orderByKey,
  push,
  query,
  ref,
  remove,
  runTransaction,
  set,
  startAt,
  update,
  type DatabaseReference,
} from "firebase/database";

import { database } from "./firebase";

/**
 * The database abstraction.
 *
 * Every feature in Same Sky reads and writes through these helpers rather than
 * calling the Firebase SDK directly. That keeps business logic testable, keeps
 * paths consistent, and means the storage layer could be replaced without
 * touching a single service above it.
 *
 * Paths are never written as literals at call sites — build them with `PATHS`
 * from `app/constants.ts`.
 */

export const dbRef = (path: string): DatabaseReference => {
  return ref(database, path);
};

export async function getData<T>(path: string): Promise<T | null> {
  const snapshot = await get(dbRef(path));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as T;
}

export async function setData<T>(path: string, value: T): Promise<void> {
  await set(dbRef(path), value);
}

export async function updateData<T extends object>(
  path: string,
  value: Partial<T>,
): Promise<void> {
  await update(dbRef(path), value);
}

export async function removeData(path: string): Promise<void> {
  await remove(dbRef(path));
}

export async function createChild<T>(path: string, value: T): Promise<string> {
  const child = push(dbRef(path));

  await set(child, value);

  return child.key as string;
}

/**
 * Reserve a child key without writing anything.
 *
 * Useful when a record needs to know its own id — every entity in Same Sky
 * stores its id inside itself so that a value read in isolation is still
 * self-describing.
 */
export function reserveChildKey(path: string): string {
  return push(dbRef(path)).key as string;
}

/**
 * Apply several writes across different paths as one atomic operation.
 *
 * Keys are absolute paths from the database root. Nothing partially applies:
 * either every path is written or none is. Used wherever a single user action
 * must land in more than one place — honouring a ritual writes the entry, the
 * day summary and the world in one commit.
 */
export async function updateMany(
  updates: Record<string, unknown>,
): Promise<void> {
  await update(ref(database), updates);
}

/**
 * Read and write a value atomically, retrying if another client changes it in
 * between.
 *
 * This is how the shared world stays correct. Two partners honouring a ritual
 * at the same moment would otherwise each read the same total and write back
 * the same increment, quietly losing one of them.
 *
 * `mutate` receives `null` when the value does not exist yet and must return
 * the complete next value.
 */
export async function transactData<T>(
  path: string,
  mutate: (current: T | null) => T,
): Promise<T> {
  const result = await runTransaction(dbRef(path), (current: T | null) =>
    mutate(current ?? null),
  );

  return result.snapshot.val() as T;
}

/**
 * Read a contiguous slice of a keyed collection, inclusive at both ends.
 *
 * Keys in Same Sky's time-series collections are `YYYY-MM-DD`, which sort
 * lexicographically in chronological order — so a date range is a key range.
 */
export async function getRange<T>(
  path: string,
  startKey: string,
  endKey: string,
): Promise<Record<string, T>> {
  const snapshot = await get(
    query(dbRef(path), orderByKey(), startAt(startKey), endAt(endKey)),
  );

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, T>;
}

/**
 * Listen for realtime changes. Returns an unsubscribe function.
 *
 * Live listeners are deliberately rare in Same Sky. Attach one only where
 * seeing a partner's action arrive in the moment is genuinely meaningful —
 * the shared world, today's rituals, a waiting note. Everything else is read
 * once, because a world that updates constantly is a world that asks to be
 * watched.
 */
export function subscribe<T>(
  path: string,
  callback: (value: T | null) => void,
): () => void {
  return onValue(dbRef(path), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback(snapshot.val() as T);
  });
}

/**
 * Subscribe to a contiguous key range of a collection.
 */
export function subscribeToRange<T>(
  path: string,
  startKey: string,
  endKey: string,
  callback: (value: Record<string, T>) => void,
): () => void {
  return onValue(
    query(dbRef(path), orderByKey(), startAt(startKey), endAt(endKey)),
    (snapshot) => {
      callback(snapshot.exists() ? (snapshot.val() as Record<string, T>) : {});
    },
  );
}
