import { useEffect } from "react";

import type { UserPreferences } from "../types/user";
import { getUserPreferences, saveUserPreferences } from "../services/user";
import { setChimeVolume, setChimesEnabled } from "../services/audio";
import { useUiStore } from "../store/uiStore";
import { useUid } from "./useAuth";

/**
 * Appearance.
 *
 * Preferences are answered by three sources, in increasing authority:
 * the operating system, this device, then the person's account. `useAppearance`
 * is what keeps all three in agreement, and it runs once from the application
 * shell.
 */

/**
 * Keep the interface in step with the operating system, and adopt the
 * preferences stored on a person's account once they sign in.
 *
 * Mount exactly once, at the root.
 */
export function useAppearance(): void {
  const uid = useUid();
  const syncWithSystem = useUiStore((state) => state.syncWithSystem);
  const hydrate = useUiStore((state) => state.hydrate);
  const ambientAudio = useUiStore((state) => state.ambientAudio);
  const ambientVolume = useUiStore((state) => state.ambientVolume);

  // The synthesised feedback chimes share the ambient-audio preference —
  // one switch for all sound, wherever in the app it happens to play.
  useEffect(() => {
    setChimesEnabled(ambientAudio);
  }, [ambientAudio]);

  useEffect(() => {
    setChimeVolume(ambientVolume);
  }, [ambientVolume]);

  // Follow the operating system while a "system" preference is in effect.
  useEffect(() => {
    const colourScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (): void => {
      syncWithSystem();
    };

    colourScheme.addEventListener("change", handleChange);
    motion.addEventListener("change", handleChange);

    return () => {
      colourScheme.removeEventListener("change", handleChange);
      motion.removeEventListener("change", handleChange);
    };
  }, [syncWithSystem]);

  // Adopt the account's preferences, so a chosen environment follows a person
  // to any device rather than living in one browser.
  useEffect(() => {
    if (!uid) return;

    let cancelled = false;

    void getUserPreferences(uid).then((preferences) => {
      if (!cancelled) {
        hydrate(preferences);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [uid, hydrate]);
}

interface AppearanceControls {
  preferences: UserPreferences;
  resolvedTheme: "light" | "dark";
  prefersStillness: boolean;
  update: (changes: Partial<UserPreferences>) => Promise<void>;
}

/**
 * Read and change appearance preferences.
 *
 * Every change is applied locally first so it is felt instantly, then written
 * to the account in the background. A failed write leaves the local choice
 * standing — a preference that silently reverts is worse than one that has not
 * yet synchronised.
 */
export function useAppearanceControls(): AppearanceControls {
  const uid = useUid();

  const theme = useUiStore((state) => state.theme);
  const motion = useUiStore((state) => state.motion);
  const ambientAudio = useUiStore((state) => state.ambientAudio);
  const ambientVolume = useUiStore((state) => state.ambientVolume);
  const hemisphere = useUiStore((state) => state.hemisphere);

  const resolvedTheme = useUiStore((state) => state.resolvedTheme);
  const prefersStillness = useUiStore((state) => state.prefersStillness);

  const setTheme = useUiStore((state) => state.setTheme);
  const setMotion = useUiStore((state) => state.setMotion);
  const setAmbientAudio = useUiStore((state) => state.setAmbientAudio);
  const setAmbientVolume = useUiStore((state) => state.setAmbientVolume);
  const setHemisphere = useUiStore((state) => state.setHemisphere);

  async function update(changes: Partial<UserPreferences>): Promise<void> {
    if (changes.theme !== undefined) setTheme(changes.theme);
    if (changes.motion !== undefined) setMotion(changes.motion);
    if (changes.ambientAudio !== undefined) setAmbientAudio(changes.ambientAudio);
    if (changes.ambientVolume !== undefined) setAmbientVolume(changes.ambientVolume);
    if (changes.hemisphere !== undefined) setHemisphere(changes.hemisphere);

    if (uid) {
      await saveUserPreferences(uid, changes);
    }
  }

  return {
    preferences: { theme, motion, ambientAudio, ambientVolume, hemisphere },
    resolvedTheme,
    prefersStillness,
    update,
  };
}

/**
 * `true` when animation should be suppressed.
 *
 * Components that animate imperatively — canvas, timers, spring physics — must
 * check this. Everything animated purely in CSS is already handled globally by
 * the reduced-motion rule in `index.css`.
 */
export function usePrefersStillness(): boolean {
  return useUiStore((state) => state.prefersStillness);
}
