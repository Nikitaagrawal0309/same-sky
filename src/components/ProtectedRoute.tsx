import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import AuthLoading from "./AuthLoading";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}