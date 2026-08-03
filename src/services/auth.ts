import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

import type { AuthError } from "../types/auth";
import { auth } from "./firebase";
import { createOrUpdateUserProfile } from "./user";

/**
 * Authentication.
 *
 * Sign-in exists to protect the shared world, so it is kept to a single step
 * with no account to create, no password to remember and no email to verify.
 */

const provider = new GoogleAuthProvider();

/*
  Always let a person choose which account to use. Silently reusing whichever
  Google session the browser happens to hold is how someone ends up signing in
  as the wrong person and finding an empty world where theirs should be.
*/
provider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, provider);

  await createOrUpdateUserProfile(result.user);

  return result.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Observe the session.
 *
 * Fires once on start-up with the restored session (or `null`), then again on
 * every change. Until that first call arrives there is no honest answer to
 * "is someone signed in", which is why the auth store starts in `resolving`
 * rather than assuming signed-out.
 */
export function observeAuthState(
  callback: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

/**
 * Translate a Firebase error into something worth showing a person.
 *
 * Nothing here blames the reader, and a cancelled popup is not treated as a
 * failure at all — deciding not to sign in is a perfectly reasonable thing to
 * do.
 */
export function toAuthError(error: unknown): AuthError | null {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "unknown";

  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return null;

    case "auth/popup-blocked":
      return {
        code,
        message:
          "Your browser blocked the sign-in window. Allow pop-ups for Same Sky and try again.",
      };

    case "auth/network-request-failed":
      return {
        code,
        message: "The connection dropped. Check your network and try again.",
      };

    case "auth/too-many-requests":
      return {
        code,
        message: "Too many attempts just now. Wait a moment, then try again.",
      };

    case "auth/unauthorized-domain":
      return {
        code,
        message:
          "Sign-in isn't allowed from this address yet. Add it to the Firebase authorised domains.",
      };

    default:
      return {
        code,
        message: "Something went wrong signing in. Please try again.",
      };
  }
}
