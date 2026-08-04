import { Suspense, type ReactNode } from "react";

import AuthLoading from "./AuthLoading";

interface Props {
  children: ReactNode;
}

/**
 * The one fallback every lazy-loaded route shares.
 *
 * Route chunks are small and this app's screens are reached over an already
 * warm connection almost all of the time, so this is rarely seen for longer
 * than a frame — but on a slow connection it stands in exactly where
 * `AuthLoading` already does, so a route that is still downloading looks no
 * different from a session that is still resolving.
 */
export default function RouteSuspense({ children }: Props) {
  return <Suspense fallback={<AuthLoading />}>{children}</Suspense>;
}
