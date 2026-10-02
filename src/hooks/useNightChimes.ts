import { useEffect } from "react";

import { playWindChime } from "../services/audio";

/**
 * Every so often after dark, the wind stirs a chime. Only while `active`
 * (night) and only if sound is on; spaced loosely so it never feels like a
 * loop.
 */
export function useNightChimes(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(
        () => {
          playWindChime();
          schedule();
        },
        9000 + Math.random() * 14000,
      );
    };

    schedule();

    return () => clearTimeout(timer);
  }, [active]);
}
