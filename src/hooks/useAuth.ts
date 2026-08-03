import type { User } from "firebase/auth";
import { useShallow } from "zustand/react/shallow";

import type { AuthError, AuthStatus } from "../types/auth";
import type { UserProfile } from "../types/user";
import { useAuthStore } from "../store/authStore";

/**
 * Reading the session.
 *
 * Each hook selects the narrowest slice it needs, so a component that only
 * cares whether someone is signed in does not re-render when their partner
 * changes their photograph. Subscribing to the whole store — which is what
 * calling `useAuthStore()` bare does — re-renders every consumer on every
 * change and is never what you want.
 */

export function useAuthStatus(): AuthStatus {
  return useAuthStore((state) => state.status);
}

/** `true` until Firebase has finished replaying any persisted session. */
export function useIsResolvingAuth(): boolean {
  return useAuthStore((state) => state.status === "resolving");
}

export function useCurrentUser(): User | null {
  return useAuthStore((state) => state.user);
}

/** The signed-in person's uid, or `null`. The most common selector by far. */
export function useUid(): string | null {
  return useAuthStore((state) => state.user?.uid ?? null);
}

export function useProfile(): UserProfile | null {
  return useAuthStore((state) => state.profile);
}

export function usePairId(): string | null {
  return useAuthStore((state) => state.pairId);
}

export function useIsPaired(): boolean {
  return useAuthStore((state) => state.isPaired);
}

export function useAuthError(): AuthError | null {
  return useAuthStore((state) => state.error);
}

export function useIsSigningIn(): boolean {
  return useAuthStore((state) => state.isSigningIn);
}

interface AuthActions {
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/**
 * The session actions. Stable across renders — these never change identity, so
 * a component using only actions never re-renders from this store at all.
 */
export function useAuthActions(): AuthActions {
  return useAuthStore(
    useShallow((state) => ({
      signIn: state.signIn,
      signOut: state.signOut,
      clearError: state.clearError,
    })),
  );
}

interface AuthSnapshot {
  status: AuthStatus;
  user: User | null;
  profile: UserProfile | null;
  pairId: string | null;
  isPaired: boolean;
}

/**
 * The whole session at once, compared shallowly.
 *
 * For the few places — routing, the shell — that genuinely need several fields
 * together. Prefer a single narrow hook everywhere else.
 */
export function useAuth(): AuthSnapshot {
  return useAuthStore(
    useShallow((state) => ({
      status: state.status,
      user: state.user,
      profile: state.profile,
      pairId: state.pairId,
      isPaired: state.isPaired,
    })),
  );
}
