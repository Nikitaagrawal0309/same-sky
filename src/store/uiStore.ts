import { create } from "zustand";

import { STORAGE_KEYS } from "../app/constants";
import { DEFAULT_USER_PREFERENCES } from "../types/user";
import type {
  Hemisphere,
  MotionPreference,
  ThemePreference,
  UserPreferences,
} from "../types/user";

/**
 * The environment a person has chosen to be in.
 *
 * Preferences live in two places at once, on purpose. Local storage answers
 * before the first paint, so returning to Same Sky is never preceded by a
 * flash of the wrong theme. Firebase answers on any device, so the choice
 * follows the person rather than the browser.
 *
 * This store is the local half and the single writer of `data-theme` on the
 * document. `services/user.ts` owns the remote half, and `useAppearance`
 * keeps the two in step.
 */

interface UiState extends UserPreferences {
  /** The theme actually applied right now, once `"system"` is resolved. */
  resolvedTheme: "light" | "dark";

  /** `true` when motion should be suppressed, from either source. */
  prefersStillness: boolean;

  setTheme: (theme: ThemePreference) => void;
  setMotion: (motion: MotionPreference) => void;
  setAmbientAudio: (enabled: boolean) => void;
  setAmbientVolume: (volume: number) => void;
  setHemisphere: (hemisphere: Hemisphere) => void;

  /** Adopt preferences loaded from a person's account. */
  hydrate: (preferences: Partial<UserPreferences>) => void;

  /** Re-resolve `"system"` choices after the operating system changes. */
  syncWithSystem: () => void;
}

/* -------------------------------------------------------------------------
   Local storage
   ------------------------------------------------------------------------- */

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Private browsing or blocked storage. Defaults are a fine answer.
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage being unavailable must never break a preference change.
  }
}

function matches(query: string): boolean {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

function systemPrefersDark(): boolean {
  return matches("(prefers-color-scheme: dark)");
}

function systemPrefersStillness(): boolean {
  return matches("(prefers-reduced-motion: reduce)");
}

function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme === "system") {
    return systemPrefersDark() ? "dark" : "light";
  }

  return theme;
}

function resolveStillness(motion: MotionPreference): boolean {
  return motion === "reduced" || systemPrefersStillness();
}

/**
 * Applying the theme to the document is a side effect, and it belongs to
 * exactly one place so the document can never disagree with the store.
 */
function applyTheme(resolved: "light" | "dark"): void {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.theme = resolved;
}

function applyStillness(prefersStillness: boolean): void {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.motion = prefersStillness ? "still" : "full";
}

function initialPreferences(): UserPreferences {
  const storedTheme = readStored(STORAGE_KEYS.theme);
  const storedMotion = readStored(STORAGE_KEYS.motion);
  const storedAudio = readStored(STORAGE_KEYS.ambientAudio);
  const storedVolume = readStored(STORAGE_KEYS.ambientVolume);
  const storedHemisphere = readStored(STORAGE_KEYS.hemisphere);

  return {
    theme:
      storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
        ? storedTheme
        : DEFAULT_USER_PREFERENCES.theme,
    motion:
      storedMotion === "reduced" || storedMotion === "system"
        ? storedMotion
        : DEFAULT_USER_PREFERENCES.motion,
    ambientAudio:
      storedAudio === null
        ? DEFAULT_USER_PREFERENCES.ambientAudio
        : storedAudio === "true",
    ambientVolume:
      storedVolume === null
        ? DEFAULT_USER_PREFERENCES.ambientVolume
        : Number(storedVolume),
    hemisphere:
      storedHemisphere === "northern" || storedHemisphere === "southern"
        ? storedHemisphere
        : DEFAULT_USER_PREFERENCES.hemisphere,
  };
}

const initial = initialPreferences();

export const useUiStore = create<UiState>((set, get) => ({
  ...initial,

  resolvedTheme: resolveTheme(initial.theme),
  prefersStillness: resolveStillness(initial.motion),

  setTheme: (theme) => {
    const resolvedTheme = resolveTheme(theme);

    writeStored(STORAGE_KEYS.theme, theme);
    applyTheme(resolvedTheme);

    set({ theme, resolvedTheme });
  },

  setMotion: (motion) => {
    const prefersStillness = resolveStillness(motion);

    writeStored(STORAGE_KEYS.motion, motion);
    applyStillness(prefersStillness);

    set({ motion, prefersStillness });
  },

  setAmbientAudio: (ambientAudio) => {
    writeStored(STORAGE_KEYS.ambientAudio, String(ambientAudio));

    set({ ambientAudio });
  },

  setAmbientVolume: (ambientVolume) => {
    const clamped = Math.min(Math.max(ambientVolume, 0), 1);

    writeStored(STORAGE_KEYS.ambientVolume, String(clamped));

    set({ ambientVolume: clamped });
  },

  setHemisphere: (hemisphere) => {
    writeStored(STORAGE_KEYS.hemisphere, hemisphere);

    set({ hemisphere });
  },

  hydrate: (preferences) => {
    const current = get();

    const theme = preferences.theme ?? current.theme;
    const motion = preferences.motion ?? current.motion;
    const resolvedTheme = resolveTheme(theme);
    const prefersStillness = resolveStillness(motion);

    writeStored(STORAGE_KEYS.theme, theme);
    writeStored(STORAGE_KEYS.motion, motion);

    applyTheme(resolvedTheme);
    applyStillness(prefersStillness);

    set({
      theme,
      motion,
      resolvedTheme,
      prefersStillness,
      ambientAudio: preferences.ambientAudio ?? current.ambientAudio,
      ambientVolume: preferences.ambientVolume ?? current.ambientVolume,
      hemisphere: preferences.hemisphere ?? current.hemisphere,
    });
  },

  syncWithSystem: () => {
    const { theme, motion } = get();
    const resolvedTheme = resolveTheme(theme);
    const prefersStillness = resolveStillness(motion);

    applyTheme(resolvedTheme);
    applyStillness(prefersStillness);

    set({ resolvedTheme, prefersStillness });
  },
}));

/*
  The document is brought into agreement with the store the moment this module
  loads, so nothing can render against a stale theme.
*/
applyTheme(useUiStore.getState().resolvedTheme);
applyStillness(useUiStore.getState().prefersStillness);
