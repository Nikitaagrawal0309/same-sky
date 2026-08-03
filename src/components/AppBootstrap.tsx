import { useEffect } from "react";
import type { ReactNode } from "react";

import { useAppearance } from "../hooks/useTheme";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: ReactNode;
}

/**
 * The application's single starting point.
 *
 * Exactly one thing observes the session and exactly one thing resolves
 * appearance, and both of them are here. Before this existed the session was
 * observed in two places at once, which is how a store and a component can end
 * up disagreeing about whether anyone is signed in.
 */
export default function AppBootstrap({ children }: Props) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // `initialize` returns its own teardown, so React's development-mode double
    // mount tears down cleanly instead of leaving a listener behind.
    return initialize();
  }, [initialize]);

  useAppearance();

  return <>{children}</>;
}
