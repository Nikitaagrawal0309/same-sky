import { ROUTES } from "../app/constants";
import { useAuth } from "../hooks/useAuth";
import { ButtonLink } from "../components/ui/Button";

/**
 * A page that is not there.
 *
 * Points home rather than apologising at length, and sends signed-in people
 * back to their world instead of to a landing page they have no use for.
 */
export default function NotFoundPage() {
  const { status, isPaired } = useAuth();

  const destination =
    status === "signed-in" ? (isPaired ? ROUTES.world : ROUTES.pair) : ROUTES.home;

  return (
    <div className="grid min-h-svh place-items-center bg-canvas px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-6xl text-ink-faint">404</p>

        <h1 className="mt-6 text-2xl text-ink">There is nothing here</h1>

        <p className="mt-4 leading-relaxed text-ink-soft">
          This path does not lead anywhere. Everything you have made is still
          where you left it.
        </p>

        <ButtonLink to={destination} className="mt-10">
          {status === "signed-in" ? "Back to your world" : "Back to the start"}
        </ButtonLink>
      </div>
    </div>
  );
}
