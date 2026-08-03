import { Navigate } from "react-router-dom";

import { APP_NAME, ROUTES } from "../app/constants";
import { useAuth } from "../hooks/useAuth";
import { useSky } from "../hooks/useWorld";
import { ButtonLink } from "../components/ui/Button";
import AuthLoading from "../components/AuthLoading";
import { SkyBackdrop } from "../components/world/SkyBackdrop";

/**
 * The landing page.
 *
 * The first thing a visitor sees is a real sky, showing their real local hour
 * — the same sky the product will show them every day afterwards. It is the
 * clearest possible statement of what this is, and it needs no explanation
 * beneath it.
 */
export default function HomePage() {
  const { status, isPaired } = useAuth();
  const sky = useSky();

  if (status === "resolving") {
    return <AuthLoading />;
  }

  // Someone who already has a world has no business on a landing page.
  if (status === "signed-in") {
    return <Navigate to={isPaired ? ROUTES.world : ROUTES.pair} replace />;
  }

  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-hidden">
      <SkyBackdrop sky={sky} className="absolute inset-0 -z-10" />

      <div className="ss-container flex flex-1 flex-col justify-center py-24">
        <div className="max-w-2xl motion-safe:animate-(--animate-rise)">
          <p className="text-sm font-medium tracking-[0.2em] text-white/70 uppercase">
            {sky.label}
          </p>

          <h1 className="mt-6 font-display text-5xl leading-[1.05] text-white sm:text-7xl">
            {APP_NAME}
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
            A quiet world built by two people, one ordinary day at a time. What
            you do out here — the walk, the water, the call you nearly didn't
            make — is what grows in there.
          </p>

          <p className="mt-6 max-w-xl leading-relaxed text-white/60">
            No streaks. No scores. Nothing to keep up with. Come back after a
            month away and everything you grew is still standing.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <ButtonLink to={ROUTES.login} size="lg">
              Begin
            </ButtonLink>

            <span className="text-sm text-white/50">
              Sign in with Google. Nothing else to set up.
            </span>
          </div>
        </div>
      </div>

      <footer className="ss-container pb-10">
        <p className="max-w-md text-sm leading-relaxed text-white/45">
          Two people in two places see the same world under two different skies.
          Yours is showing the hour where you are, right now.
        </p>
      </footer>
    </div>
  );
}
