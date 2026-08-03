import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { ROUTES } from "../app/constants";
import { useAuth } from "../hooks/useAuth";
import AuthLoading from "./AuthLoading";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * A route that requires someone to be signed in.
 *
 * Waits for the session to resolve before deciding anything. Treating the
 * unresolved moment as "signed out" is what sends a person who is already
 * signed in back to the sign-in screen for a frame.
 *
 * Where they were headed is carried along, so signing in returns them there
 * rather than dropping them at a generic landing page.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "resolving") {
    return <AuthLoading />;
  }

  if (status === "signed-out") {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
