import { create } from "zustand";
import type { User } from "firebase/auth";

import { observeAuthState } from "../services/auth";
import {
  getData,
  subscribe,
} from "../services/database";

interface UserProfile {
  pairId: string | null;
}

interface AuthState {
  user: User | null;

  loading: boolean;

  pairId: string | null;

  isPaired: boolean;

  setUser: (user: User | null) => void;

  setPairId: (
    pairId: string | null
  ) => void;

  clearSession: () => void;

  initialize: () => () => void;
}

export const useAuthStore =
  create<AuthState>((set) => ({
    user: null,

    loading: false,

    pairId: null,

    isPaired: false,

    setUser: (user) =>
      set({
        user,
      }),

    setPairId: (pairId) =>
      set({
        pairId,
        isPaired: pairId !== null,
      }),

    clearSession: () =>
      set({
        user: null,
        loading: false,
        pairId: null,
        isPaired: false,
      }),

    initialize: () => {
      let unsubscribeProfile:
        | (() => void)
        | undefined;

      const unsubscribeAuth =
        observeAuthState(async (user) => {
          unsubscribeProfile?.();

          if (!user) {
            set({
              user: null,
              pairId: null,
              isPaired: false,
              loading: false,
            });

            return;
          }

          set({
            user,
          });

          console.log("Auth user:", user.uid);

const profile = await getData<UserProfile>(
  `users/${user.uid}`
);

console.log("Profile:", profile);


console.log("Setting loading false");
          set({
            pairId:
              profile?.pairId ?? null,
            isPaired:
              profile?.pairId !== null,
            loading: false,
          });

          unsubscribeProfile =
            subscribe<UserProfile>(
              `users/${user.uid}`,
              (profile) => {
                set({
                  pairId:
                    profile?.pairId ??
                    null,
                  isPaired:
                    profile?.pairId !==
                    null,
                });
              }
            );
        });

      return () => {
        unsubscribeAuth();
        unsubscribeProfile?.();
      };
    },
  }));