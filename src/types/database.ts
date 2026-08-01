import type { Pair } from "./pair";
import type { WorldState } from "./world";

export interface UserProfile {
  uid: string;

  displayName: string;

  email: string;

  photoURL: string | null;

  pairId: string | null;

  createdAt: number;

  lastSeen: number;
}

export interface DatabaseSchema {
  users: Record<string, UserProfile>;

  pairs: Record<string, Pair>;

  world: Record<string, WorldState>;
}