import type { User } from "firebase/auth";

import { getData, setData, updateData } from "./database";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  pairId: string | null;
  createdAt: number;
  lastSeen: number;
}

export async function createOrUpdateUserProfile(
  user: User
): Promise<UserProfile> {
  const path = `users/${user.uid}`;

  const existing = await getData<UserProfile>(path);

  if (!existing) {
    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName ?? "Unknown",
      email: user.email ?? "",
      photoURL: user.photoURL,
      pairId: null,
      createdAt: Date.now(),
      lastSeen: Date.now(),
    };

    await setData(path, profile);

    return profile;
  }

  await updateData<UserProfile>(path, {
    displayName: user.displayName ?? existing.displayName,
    email: user.email ?? existing.email,
    photoURL: user.photoURL,
    lastSeen: Date.now(),
  });

  return {
    ...existing,
    displayName: user.displayName ?? existing.displayName,
    email: user.email ?? existing.email,
    photoURL: user.photoURL,
    lastSeen: Date.now(),
  };
}