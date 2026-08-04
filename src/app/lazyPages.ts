import { lazy } from "react";

/**
 * Every route-level page loaded on demand.
 *
 * Kept in its own module — separate from `router.tsx` — because a file
 * mixing `React.lazy()` component declarations with non-component exports
 * (the `router` object itself) breaks Vite's Fast Refresh boundary
 * detection. A module that exports only components has no such problem.
 *
 * `HomePage` is not here: it loads eagerly from `router.tsx`, since it is
 * the first thing a signed-out visitor sees and the one screen where an
 * extra network round trip before paint would actually be felt.
 */
export const LoginPage = lazy(() => import("../pages/LoginPage"));
export const RegisterPage = lazy(() => import("../pages/RegisterPage"));
export const PairPage = lazy(() => import("../pages/PairPage"));
export const WorldPage = lazy(() => import("../pages/WorldPage"));
export const DashboardPage = lazy(() => import("../pages/DashboardPage"));
export const JournalPage = lazy(() => import("../pages/JournalPage"));
export const MemoriesPage = lazy(() => import("../pages/MemoriesPage"));
export const ProfilePage = lazy(() => import("../pages/ProfilePage"));
export const SettingsPage = lazy(() => import("../pages/SettingsPage"));
export const TimelinePage = lazy(() => import("../pages/TimelinePage"));
export const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
