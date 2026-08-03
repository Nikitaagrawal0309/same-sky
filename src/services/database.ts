import {
  get,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
  type DatabaseReference,
} from "firebase/database";

import { database } from "./firebase";

/**
 * Root database helper.
 * Every feature in Same Sky should use these helpers
 * instead of directly calling the Firebase SDK.
 */

export const dbRef = (
  path: string
): DatabaseReference => {
  return ref(database, path);
};

export async function getData<T>(
  path: string
): Promise<T | null> {
  const snapshot = await get(dbRef(path));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as T;
}

export async function setData<T>(
  path: string,
  value: T
): Promise<void> {
  await set(dbRef(path), value);
}

export async function updateData<
  T extends object
>(
  path: string,
  value: Partial<T>
): Promise<void> {
  await update(dbRef(path), value);
}

export async function removeData(
  path: string
): Promise<void> {
  await remove(dbRef(path));
}

export async function createChild<T>(
  path: string,
  value: T
): Promise<string> {
  const child = push(dbRef(path));

  await set(child, value);

  return child.key as string;
}

/**
 * Listen for realtime changes.
 * Returns an unsubscribe function.
 */

export function subscribe<T>(
  path: string,
  callback: (value: T | null) => void
): () => void {
  return onValue(
    dbRef(path),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback(snapshot.val() as T);
    }
  );
}