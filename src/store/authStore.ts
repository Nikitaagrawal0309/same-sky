import type { User } from "firebase/auth";
import { create } from "zustand";

import type { AuthError, AuthStatus } from "../types/auth";
import type { UserProfile } from "../types/user";
import { observeAuthState, signInWithGoogle, logout, toAuthError } from "../services/auth";
import { createOrUpdateUserProfile, subscribeToUserProfile } from "../services/user";

/**
 * The session.
 *
 * One store, one source of truth for "who is here and do they have a world
 * yet". Everything downstream — routing, the shell, the world store — reads
 * from this and nothing else re-derives it.
 *
 * The state machine matters more than it looks:
 *
 *   resolving → signed-out          nobody is signed in
 *   resolving → signed-in           a session was restored, profile loaded
 *
 * `resolving` is the initial state, not `signed-out`. Firebase needs a moment
 * to replay a persisted session, and answering "signed out" during that moment
 * is what bounces a returning person back to a sign-in screen they had already
 * passed. Routing waits instead of guessing.
 */

interface AuthState {
  status: AuthStatus;

  user: User | null;

  profile: UserProfile | null;

  /** The pair this person belongs to, mirrored from their profile. */
  pairId: string | null;

  isPaired: boolean;

  error: AuthError | null;

  /** `true` while a sign-in the person initiated is in flight. */
  isSigningIn: boolean;

  /**
   * Begin observing the session. Returns a teardown function.
   *
   * Called exactly once, by `AppBootstrap`. Safe to call again — each call
   * returns its own teardown.
   */
  initialize: () => () => void;

  signIn: () => Promise<boolean>;

  signOut: () => Promise<void>;

  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "resolving",
  user: null,
  profile: null,
  pairId: null,
  isPaired: false,
  error: null,
  isSigningIn: false,

  initialize: () => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = observeAuthState(async (user) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;

      if (!user) {
        set({
          status: "signed-out",
          user: null,
          profile: null,
          pairId: null,
          isPaired: false,
        });

        return;
      }

      /*
        Ensure the profile exists before announcing the session. Routing
        depends on `pairId`, and a signed-in state with an unread profile
        would send a paired person to the pairing screen for a frame.
      */
      let profile: UserProfile | null = null;

      try {
        profile = await createOrUpdateUserProfile(user);
      } catch (error) {
        // A profile read can fail on a cold or offline start. The session is
        // still real, so sign the person in and let the live subscription
        // below fill the profile in when the connection returns.
        console.error("Unable to load profile", error);
      }

      set({
        status: "signed-in",
        user,
        profile,
        pairId: profile?.pairId ?? null,
        isPaired: Boolean(profile?.pairId),
        error: null,
      });

      /*
        Stay subscribed so that the moment a partner accepts an invitation —
        which writes `pairId` onto this profile — the world opens without a
        reload.
      */
      unsubscribeProfile = subscribeToUserProfile(user.uid, (next) => {
        if (get().user?.uid !== user.uid) return;

        set({
          profile: next,
          pairId: next?.pairId ?? null,
          isPaired: Boolean(next?.pairId),
        });
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  },

  signIn: async () => {
    set({ isSigningIn: true, error: null });

    try {
      await signInWithGoogle();

      // `observeAuthState` publishes the session; nothing to set here.
      return true;
    } catch (error) {
      // `toAuthError` returns null when a person simply closed the popup,
      // which is a decision rather than a failure and needs no message.
      set({ error: toAuthError(error) });

      return false;
    } finally {
      set({ isSigningIn: false });
    }
  },

  signOut: async () => {
    await logout();

    set({
      status: "signed-out",
      user: null,
      profile: null,
      pairId: null,
      isPaired: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
