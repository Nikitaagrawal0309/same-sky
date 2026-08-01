import { create } from "zustand";
import type { User } from "firebase/auth";

import { observeAuthState } from "../services/auth";

interface AuthState {
  user: User | null;

  loading: boolean;

  pairId: string | null;

  isPaired: boolean;

  setUser: (user: User | null) => void;

  setLoading: (loading: boolean) => void;

  setPairId: (pairId: string | null) => void;

  clearSession: () => void;

  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  loading: true,

  pairId: null,

  isPaired: false,

  setUser: (user) =>
    set({
      user,
    }),

  setLoading: (loading) =>
    set({
      loading,
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
    return observeAuthState((user) => {
      set({
        user,
        loading: false,
      });
    });
  },
}));