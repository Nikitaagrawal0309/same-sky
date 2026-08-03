import { Navigate } from "react-router-dom";

import { ROUTES } from "../app/constants";
import {
  useAuth,
  useAuthActions,
  useAuthError,
  useIsSigningIn,
} from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import AuthLoading from "../components/AuthLoading";

/**
 * Beginning.
 *
 * Same Sky has no separate registration: signing in with Google for the first
 * time is what creates a person. This route exists because "register" is where
 * someone new naturally looks, and being told a page does not exist is a poor
 * welcome. The words differ from sign-in; the door is the same one.
 */
export default function RegisterPage() {
  const { status, isPaired } = useAuth();
  const { signIn } = useAuthActions();
  const error = useAuthError();
  const isSigningIn = useIsSigningIn();

  if (status === "resolving") {
    return <AuthLoading />;
  }

  if (status === "signed-in") {
    return <Navigate to={isPaired ? ROUTES.world : ROUTES.pair} replace />;
  }

  return (
    <Card padding="lg" className="motion-safe:animate-(--animate-rise)">
      <h1 className="text-3xl text-ink">Start a world</h1>

      <p className="mt-4 leading-relaxed text-ink-soft">
        It begins as a seed and a patch of ground. What the two of you do out in
        the world is what grows in it.
      </p>

      <Button
        block
        size="lg"
        className="mt-10"
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
        Already have a world?{" "}
        <a
          href={ROUTES.login}
          className="text-accent underline-offset-4 hover:underline"
          onClick={(event) => {
            // Same door; keep it a client-side move rather than a full reload.
            event.preventDefault();
            void signIn();
          }}
        >
          Sign in instead
        </a>
        .
      </p>

      <p className="sr-only">
        Registration and sign-in use the same Google account. Choosing either
        one has the same effect.
      </p>
    </Card>
  );
}
