import { createBrowserRouter, Navigate } from "react-router-dom";

import { ROUTES } from "./constants";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import AuthGate from "../components/AuthGate";
import ProtectedRoute from "../components/ProtectedRoute";
import RouteSuspense from "../components/RouteSuspense";

// The landing page loads eagerly — it is the first thing anyone signed out
// sees, and the one screen where an extra network round trip before paint
// would actually be felt. Every other route is fetched only once someone is
// headed there, which keeps the initial bundle to what a first visit needs.
import HomePage from "../pages/HomePage";
import {
  DashboardPage,
  JournalPage,
  LoginPage,
  MemoriesPage,
  NotFoundPage,
  PairPage,
  ProfilePage,
  RegisterPage,
  SettingsPage,
  TimelinePage,
  WorldPage,
} from "./lazyPages";

/**
 * Routing.
 *
 * Three tiers of access, and every route sits in exactly one of them:
 *
 *   public          anyone — the landing page and sign-in
 *   ProtectedRoute  signed in — pairing, profile, settings
 *   AuthGate        signed in *and* paired — everything the product is about
 *
 * The distinction between the last two matters. Someone who has signed in but
 * not yet paired still needs to reach their settings, not least to sign out
 * again, so those screens sit behind the weaker guard.
 *
 * Every layout wraps its own `<Outlet />` in a `RouteSuspense`, so a lazy
 * page's chunk loading in shows the same quiet fallback the app already uses
 * for auth — never a blank frame, and never the header or navigation
 * disappearing along with the content while a route change loads.
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <MainLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },

  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },

  {
    /*
      Pairing stands on its own, without the application shell. It is a single
      decision made once, and navigation around it would only be a distraction
      from it.
    */
    path: ROUTES.pair,
    element: (
      <ProtectedRoute>
        <RouteSuspense>
          <PairPage />
        </RouteSuspense>
      </ProtectedRoute>
    ),
  },

  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ROUTES.world,
        element: (
          <AuthGate>
            <WorldPage />
          </AuthGate>
        ),
      },
      {
        path: ROUTES.dashboard,
        element: (
          <AuthGate>
            <DashboardPage />
          </AuthGate>
        ),
      },
      {
        path: ROUTES.journal,
        element: (
          <AuthGate>
            <JournalPage />
          </AuthGate>
        ),
      },
      {
        path: ROUTES.memories,
        element: (
          <AuthGate>
            <MemoriesPage />
          </AuthGate>
        ),
      },
      {
        path: ROUTES.timeline,
        element: (
          <AuthGate>
            <TimelinePage />
          </AuthGate>
        ),
      },
      { path: ROUTES.profile, element: <ProfilePage /> },
      { path: ROUTES.settings, element: <SettingsPage /> },
    ],
  },

  // Kept so older links continue to resolve.
  { path: "/home", element: <Navigate to={ROUTES.home} replace /> },

  {
    path: "*",
    element: (
      <RouteSuspense>
        <NotFoundPage />
      </RouteSuspense>
    ),
  },
]);
