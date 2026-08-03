import type { User } from "firebase/auth";

import { PATHS } from "../app/constants";
import { DEFAULT_USER_PREFERENCES } from "../types/user";
import type { PartnerSummary, UserPreferences, UserProfile } from "../types/user";
import { getData, setData, subscribe, updateData } from "./database";

/**
 * People.
 *
 * A profile is created the first time someone signs in and is never recreated
 * afterwards — subsequent sign-ins only refresh the fields Google owns
 * (`displayName`, `email`, `photoURL`) and touch `lastSeen`. Anything Same Sky
 * owns, above all `pairId`, is never overwritten by an authentication event.
 */

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return getData<UserProfile>(PATHS.user(uid));
}

/**
 * Create a profile on first sign-in, or refresh the provider-owned fields on
 * every sign-in after that.
 */
export async function createOrUpdateUserProfile(user: User): Promise<UserProfile> {
  const path = PATHS.user(user.uid);
  const existing = await getData<UserProfile>(path);
  const now = Date.now();

  if (!existing) {
    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName ?? "Friend",
      email: user.email ?? "",
      photoURL: user.photoURL,
      pairId: null,
      createdAt: now,
      lastSeen: now,
    };

    await setData(path, profile);

    return profile;
  }

  /*
    A partial update, not a whole-record write: `pairId` and `createdAt` belong
    to Same Sky and must survive every sign-in untouched.
  */
  const refreshed: Pick<
    UserProfile,
    "displayName" | "email" | "photoURL" | "lastSeen"
  > = {
    displayName: user.displayName ?? existing.displayName,
    email: user.email ?? existing.email,
    photoURL: user.photoURL,
    lastSeen: now,
  };

  await updateData<UserProfile>(path, refreshed);

  return { ...existing, ...refreshed };
}

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void,
): () => void {
  return subscribe<UserProfile>(PATHS.user(uid), callback);
}

/* -------------------------------------------------------------------------
   Preferences
   ------------------------------------------------------------------------- */

/**
 * Preferences follow a person between devices, so they live beside the
 * profile rather than only in local storage. Any field absent from storage
 * falls back to its default, which means new preferences can be introduced
 * without migrating existing people.
 */
export async function getUserPreferences(uid: string): Promise<UserPreferences> {
  const stored = await getData<Partial<UserPreferences>>(PATHS.userPreferences(uid));

  return { ...DEFAULT_USER_PREFERENCES, ...stored };
}

export async function saveUserPreferences(
  uid: string,
  preferences: Partial<UserPreferences>,
): Promise<void> {
  await updateData<UserPreferences>(PATHS.userPreferences(uid), preferences);
}

/* -------------------------------------------------------------------------
   Presentation
   ------------------------------------------------------------------------- */

/**
 * Reduce a profile to what the interface is allowed to say about a person.
 */
export function toPartnerSummary(
  profile: UserProfile,
  selfUid: string,
): PartnerSummary {
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    isSelf: profile.uid === selfUid,
  };
}
