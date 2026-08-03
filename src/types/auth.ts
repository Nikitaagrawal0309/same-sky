/**
 * Authentication as the rest of the application sees it.
 *
 * These types deliberately describe *session* rather than *credentials*.
 * Nothing outside `services/auth.ts` should need to know that Firebase is the
 * provider, which keeps the door open to changing it without touching the
 * interface layer.
 */

import type { UserProfile } from "./user";

/**
 * How far along the sign-in sequence the application currently is.
 *
 * `resolving` is the important one: until Firebase has replayed the persisted
 * session there is no honest answer to "is someone signed in", and routing
 * must wait rather than guess. Guessing is what causes a returning person to
 * be bounced to the sign-in screen they had already passed.
 */
export type AuthStatus =
  | "resolving"
  | "signed-out"
  | "signed-in";

/**
 * The signed-in person, once both Firebase and their stored profile agree.
 */
export interface AuthSession {
  uid: string;

  displayName: string;

  email: string;

  photoURL: string | null;

  profile: UserProfile;
}

export interface AuthError {
  code: string;

  /** A message safe and kind enough to show directly to a person. */
  message: string;
}
