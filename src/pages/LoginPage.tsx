import { Navigate, useLocation } from "react-router-dom";

import { ROUTES } from "../app/constants";
import {
  useAuth,
  useAuthActions,
  useAuthError,
  useIsSigningIn,
} from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { GoogleIcon } from "../components/ui/GoogleIcon";
import AuthLoading from "../components/AuthLoading";

interface LocationState {
  /** Where the person was headed before they were asked to sign in. */
  from?: string;
}

/**
 * Signing in.
 *
 * One button. There is no account to create, no password to remember and
 * nothing to verify — the sign-in exists to protect a shared world, and every
 * extra step is a step between two people and theirs.
 */
export default function LoginPage() {
  const { status, isPaired } = useAuth();
  const { signIn } = useAuthActions();
  const error = useAuthError();
  const isSigningIn = useIsSigningIn();
  const location = useLocation();

  if (status === "resolving") {
    return <AuthLoading />;
  }

  if (status === "signed-in") {
    const state = location.state as LocationState | null;
    const intended = isPaired ? (state?.from ?? ROUTES.world) : ROUTES.pair;

    return <Navigate to={intended} replace />;
  }

  return (
    <Card padding="lg" className="motion-safe:animate-(--animate-rise)">
      <h1 className="text-3xl text-ink">Welcome back</h1>

      <p className="mt-4 leading-relaxed text-ink-soft">
        Your world is exactly where you left it. Nothing expired while you were
        away.
      </p>

      <Button
        block
        size="lg"
        variant="quiet"
        className="mt-10"
        icon={<GoogleIcon className="size-4.5" />}
        loading={isSigningIn}
        loadingLabel="Opening…"
        onClick={() => void signIn()}
      >
        Continue with Google
      </Button>

      {error ? (
        <p role="alert" className="mt-5 text-sm leading-relaxed text-ember">
          {error.message}
        </p>
      ) : null}

      <p className="mt-8 text-sm leading-relaxed text-ink-faint">
        Same Sky is built for two people. Signing in creates your half of a
        shared world — you will be asked to invite the other person, or to
        accept their invitation, next.
      </p>
    </Card>
  );
}
