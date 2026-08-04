import { Link, Outlet } from "react-router-dom";

import { APP_NAME, ROUTES } from "../app/constants";
import RouteSuspense from "../components/RouteSuspense";

/**
 * The sign-in shell.
 *
 * A single centred column on a quiet canvas. Signing in is a doorway, not a
 * destination, so there is nothing here to look at for longer than it takes to
 * walk through it.
 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <header className="ss-container flex h-20 items-center">
        <Link
          to={ROUTES.home}
          className="font-display text-lg tracking-tight text-ink transition-opacity hover:opacity-70"
        >
          {APP_NAME}
        </Link>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-6 pb-24"
      >
        <div className="w-full max-w-md">
          <RouteSuspense>
            <Outlet />
          </RouteSuspense>
        </div>
      </main>
    </div>
  );
}
