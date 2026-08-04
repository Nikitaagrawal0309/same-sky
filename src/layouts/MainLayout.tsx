import { Outlet } from "react-router-dom";

import RouteSuspense from "../components/RouteSuspense";

/**
 * The public shell.
 *
 * Wraps everything a person can see before they sign in. It carries no
 * navigation at all: there is exactly one thing to do here, and adding a menu
 * around it would only make that less clear.
 */
export default function MainLayout() {
  return (
    <div className="min-h-svh bg-canvas">
      <a href="#main" className="ss-skip-link">
        Skip to content
      </a>

      <main id="main" tabIndex={-1}>
        <RouteSuspense>
          <Outlet />
        </RouteSuspense>
      </main>
    </div>
  );
}
