import { useCallback, useEffect, useState } from "react";

import { setData, subscribe } from "../services/database";

/**
 * A small shared value, live from the database, with an on-device fallback.
 *
 * Reads subscribe to `path`. Writes go to a child of it. If the database
 * refuses the path (most often because its security rules haven't been
 * updated for a new feature yet), the value is kept in localStorage instead,
 * so the feature still works on this device rather than silently failing.
 * As soon as the path becomes readable again the live value takes over.
 */
export interface SyncedValue<T> {
  value: T | null;
  /** `true` once a first value (live or local) is available. */
  ready: boolean;
  /** `true` while running from the on-device copy. */
  local: boolean;
  /** Write `childValue` at `childPath` (slash-separated, relative to `path`). `null` removes it. */
  write: (childPath: string, childValue: unknown) => Promise<void>;
}

function readLocal<T>(key: string | null): T | null {
  if (!key) return null;

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage blocked — nothing more we can do. */
  }
}

/** Immutably set a nested key on a plain object. */
function setIn(target: unknown, segments: string[], value: unknown): Record<string, unknown> {
  const base: Record<string, unknown> =
    target && typeof target === "object" ? { ...(target as Record<string, unknown>) } : {};
  const [head, ...rest] = segments;

  if (rest.length === 0) {
    if (value === null) delete base[head];
    else base[head] = value;
  } else {
    base[head] = setIn(base[head], rest, value);
  }

  return base;
}

export function useSyncedValue<T>(path: string | null, localKey: string | null): SyncedValue<T> {
  const [remote, setRemote] = useState<{ path: string; value: T | null } | null>(null);
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState<{ key: string | null; value: T | null }>(() => ({
    key: localKey,
    value: readLocal<T>(localKey),
  }));

  useEffect(() => {
    if (!path) return;

    return subscribe<T>(
      path,
      (value) => setRemote({ path, value }),
      () => setFailedPath(path),
    );
  }, [path]);

  const local = path !== null && failedPath === path;
  const currentLocal = localValue.key === localKey ? localValue.value : readLocal<T>(localKey);
  const live = remote && remote.path === path ? remote : null;

  const write = useCallback(
    async (childPath: string, childValue: unknown) => {
      if (!path) return;

      const segments = childPath.split("/").filter(Boolean);

      const keepLocally = () => {
        if (!localKey) return;

        const next = setIn(readLocal<T>(localKey), segments, childValue) as T;
        writeLocal(localKey, next);
        setLocalValue({ key: localKey, value: next });
      };

      if (local) {
        keepLocally();
        return;
      }

      try {
        await setData(`${path}/${segments.join("/")}`, childValue);
      } catch (error) {
        console.warn(`[Same Sky] Couldn't save to "${path}", keeping it on this device instead.`, error);
        keepLocally();
        setFailedPath(path);
      }
    },
    [path, localKey, local],
  );

  return {
    value: local ? currentLocal : (live?.value ?? null),
    ready: local || live !== null,
    local,
    write,
  };
}
