/**
 * A person inside Same Sky.
 *
 * Stored at `users/{uid}`. This is the single canonical definition — services
 * and stores must import it from here rather than redeclaring their own shape.
 */
export interface UserProfile {
  uid: string;

  displayName: string;

  email: string;

  photoURL: string | null;

  /** The pair this person belongs to, or `null` while they are still alone. */
  pairId: string | null;

  createdAt: number;

  lastSeen: number;
}

export type ThemePreference = "light" | "dark" | "system";

export type MotionPreference = "system" | "reduced";

/**
 * Which half of the world a person lives in.
 *
 * The shared world follows the seasons, and the seasons are opposite north and
 * south. This cannot be inferred reliably from a browser, so it is asked once
 * and remembered rather than assumed.
 */
export type Hemisphere = "northern" | "southern";

/**
 * Personal, device-independent preferences.
 *
 * Stored at `users/{uid}/preferences` so a person's chosen environment follows
 * them to any device they sign in from.
 */
export interface UserPreferences {
  theme: ThemePreference;

  /** Ambient environmental audio inside the shared world. */
  ambientAudio: boolean;

  /** Ambient audio level, 0–1. */
  ambientVolume: number;

  /**
   * Explicit motion override. `"system"` defers to `prefers-reduced-motion`;
   * `"reduced"` forces stillness even when the operating system allows motion.
   */
  motion: MotionPreference;

  /** Determines which seasons the shared world moves through. */
  hemisphere: Hemisphere;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: "system",
  ambientAudio: true,
  ambientVolume: 0.45,
  motion: "system",
  hemisphere: "northern",
};

/**
 * A partner as presented in the interface: the profile data the UI needs to
 * speak about a person warmly, without exposing their full record.
 */
export interface PartnerSummary {
  uid: string;

  displayName: string;

  photoURL: string | null;

  /** `true` when this summary describes the person currently signed in. */
  isSelf: boolean;
}
