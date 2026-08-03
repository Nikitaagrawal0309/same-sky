import { APP_NAME } from "../app/constants";

/**
 * The moment before the world appears.
 *
 * Shown while a persisted session is being replayed. It is deliberately quiet
 * and deliberately unhurried: no spinner, no progress bar, nothing that
 * suggests waiting is a problem. Most of the time it is on screen for a single
 * frame and nobody sees it at all.
 */
export default function AuthLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-svh place-items-center bg-canvas px-6"
    >
      <div className="text-center">
        <p className="font-display text-2xl tracking-tight text-ink motion-safe:animate-(--animate-shimmer)">
          {APP_NAME}
        </p>

        <p className="mt-3 text-sm text-ink-faint">Opening your world…</p>
      </div>
    </div>
  );
}
