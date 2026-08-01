import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

import { auth } from "./firebase";
import { createOrUpdateUserProfile } from "./user";

const provider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, provider);

  await createOrUpdateUserProfile(result.user);

  return result.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export function observeAuthState(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await createOrUpdateUserProfile(user);
    }

    callback(user);
  });
}