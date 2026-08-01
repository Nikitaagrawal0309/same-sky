import { useEffect } from "react";
import type { ReactNode } from "react";

import AuthLoading from "./AuthLoading";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: ReactNode;
}

export default function AppBootstrap({
  children,
}: Props) {
  const loading = useAuthStore((state) => state.loading);
  const initialize = useAuthStore(
    (state) => state.initialize
  );

  useEffect(() => {
    const unsubscribe = initialize();

    return () => unsubscribe();
  }, [initialize]);

  if (loading) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}