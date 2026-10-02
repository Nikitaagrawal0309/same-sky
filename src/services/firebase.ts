import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getDatabase, type Database } from "firebase/database";

/**
 * The single Firebase entry point.
 *
 * Nothing outside this file and `services/database.ts` should import from the
 * Firebase SDK. Keeping the SDK behind two modules is what allows the rest of
 * the application — every service, store and component — to stay unaware of
 * which backend it happens to be running on.
 *
 * Configuration is read from the environment when provided and falls back to
 * the project's committed values otherwise, so a fresh clone runs with no
 * setup. Firebase web configuration is public by design: it identifies the
 * project rather than authorising access, which is enforced entirely by
 * Realtime Database security rules.
 */

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ??
    "AIzaSyD7c6b5lErGaFDnMQsKd7E_V6w5MZXGdbM",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "tracker-25c92.firebaseapp.com",
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ??
    "https://tracker-25c92-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "tracker-25c92",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    "tracker-25c92.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "442090900397",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    "1:442090900397:web:f6327bd6aaa5669d4baf24",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-2HM3J1PF4B",
};

/*
  Guarded so that a hot module reload during development reuses the existing
  app instead of throwing on a duplicate initialisation.
*/
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * Sessions persist across restarts, which is a product requirement: coming
 * back to Same Sky should never mean signing in again.
 *
 * IndexedDB is preferred and `localStorage` is the fallback, so the session
 * survives even where IndexedDB is unavailable (private browsing on some
 * platforms).
 */
function resolveAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    // Already initialised — a hot module reload re-executed this module.
    return getAuth(app);
  }
}

/*
  App Check: proves to Firebase that a request really comes from Same Sky
  (not a script or a look-alike site reusing this public config). Uses an
  invisible reCAPTCHA Enterprise check. The site key is public by design;
  verification happens between Firebase and Google, with no secret in the app.

  Started before any database or auth call so every request carries a token.
  Does nothing until a site key is configured.
*/
const APP_CHECK_SITE_KEY: string =
  import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY ?? "6Ld65dstAAAAAG7xduXyZw9_5VbZc4jSKVcwIFSJ";

if (APP_CHECK_SITE_KEY && typeof window !== "undefined") {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // Already initialised — a hot module reload re-executed this module.
  }
}

export const auth: Auth = resolveAuth();

export const database: Database = getDatabase(app);

export default app;
