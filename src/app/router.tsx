import { createBrowserRouter, Navigate } from "react-router-dom";

import { ROUTES } from "./constants";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import AuthGate from "../components/AuthGate";
import ProtectedRoute from "../components/ProtectedRoute";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import PairPage from "../pages/PairPage";
import WorldPage from "../pages/WorldPage";
import DashboardPage from "../pages/DashboardPage";
import JournalPage from "../pages/JournalPage";
import MemoriesPage from "../pages/MemoriesPage";
import ProfilePage from "../pages/ProfilePage";
import SettingsPage from "../pages/SettingsPage";
import TimelinePage from "../pages/TimelinePage";
import NotFoundPage from "../pages/NotFoundPage";

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
        <PairPage />
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

  { path: "*", element: <NotFoundPage /> },
]);
