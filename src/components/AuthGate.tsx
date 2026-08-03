import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { ROUTES } from "../app/constants";
import { useAuth } from "../hooks/useAuth";
import AuthLoading from "./AuthLoading";

interface Props {
  children: ReactNode;
}

/**
 * A route that requires a shared world.
 *
 * Everything the product is actually about — rituals, the journal, memories,
 * reflections — belongs to a pair. This gate stands in front of all of it:
 * signed out goes to sign-in, signed in but unpaired goes to pairing, and only
 * someone with a world gets through.
 *
 * `ProtectedRoute` is the weaker guard, for screens a person can reach on
 * their own before a partner ever arrives.
 */
export default function AuthGate({ children }: Props) {
  const { status, isPaired } = useAuth();
  const location = useLocation();

  if (status === "resolving") {
    return <AuthLoading />;
  }

  if (status === "signed-out") {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  if (!isPaired) {
    return <Navigate to={ROUTES.pair} replace />;
  }

  return <>{children}</>;
}
