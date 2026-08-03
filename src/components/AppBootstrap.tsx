import { useEffect } from "react";

import { observeAuthState } from "../services/auth";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: React.ReactNode;
}

export default function AppBootstrap({ children }: Props) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    const unsubscribe = observeAuthState((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [setUser, setLoading]);

  return <>{children}</>;
}