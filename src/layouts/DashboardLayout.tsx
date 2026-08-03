import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { usePairId, useUid } from "../hooks/useAuth";
import { useWorldStore } from "../store/worldStore";
import { AppHeader } from "../components/layout/AppHeader";
import { AppNavigationBar } from "../components/layout/AppNavigation";

/**
 * The signed-in application shell.
 *
 * Owns the one place the shared world is attached. Every listener the product
 * needs — the pair, the world, its recent history, today's rituals, the
 * partner's profile — opens here and closes when the shell unmounts, so no
 * screen has to think about subscriptions and none of them can leak one.
 *
 * The shell also renders for someone who has not paired yet, which is what
 * lets them reach their profile and settings — including signing out — before
 * a world exists.
 */
export default function DashboardLayout() {
  const pairId = usePairId();
  const uid = useUid();
  const attach = useWorldStore((state) => state.attach);

  useEffect(() => {
    if (!pairId || !uid) return;

    return attach(pairId, uid);
  }, [pairId, uid, attach]);

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <a href="#main" className="ss-skip-link">
        Skip to content
      </a>

      <AppHeader />

      {/* The trailing space clears the bottom navigation on small screens. */}
      <main id="main" tabIndex={-1} className="flex-1 pb-24 md:pb-16">
        <Outlet />
      </main>

      <AppNavigationBar />
    </div>
  );
}
