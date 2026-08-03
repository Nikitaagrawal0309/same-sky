import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

import { APP_NAME, ROUTES } from "../../app/constants";
import { useProfile } from "../../hooks/useAuth";
import { usePartner } from "../../hooks/useWorld";
import { Avatar } from "../ui/Avatar";
import { AppNavigation } from "./AppNavigation";

/**
 * The header.
 *
 * Carries the name of the product, the way through it, and the two people it
 * belongs to. It holds no counts, no badges and nothing that changes to draw
 * the eye — a header that keeps moving is a header that keeps asking to be
 * looked at.
 */
export function AppHeader() {
  const profile = useProfile();
  const partner = usePartner();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="ss-container flex h-16 items-center justify-between gap-6">
        <Link
          to={ROUTES.world}
          className="font-display text-lg tracking-tight text-ink transition-opacity hover:opacity-70"
        >
          {APP_NAME}
        </Link>

        <AppNavigation />

        <div className="flex items-center gap-2">
          {/*
            Both faces, side by side, in every corner of the product. It is a
            small thing, and it is the reason the app never feels like one
            person's account with a guest in it.
          */}
          <span className="flex items-center -space-x-2">
            {profile ? (
              <Avatar
                name={profile.displayName}
                photoURL={profile.photoURL}
                size="sm"
                className="ring-2 ring-canvas"
              />
            ) : null}

            {partner ? (
              <Avatar
                name={partner.displayName}
                photoURL={partner.photoURL}
                size="sm"
                className="ring-2 ring-canvas"
              />
            ) : null}
          </span>

          <Link
            to={ROUTES.settings}
            aria-label="Settings"
            className="rounded-full p-2 text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <Settings aria-hidden className="size-5" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </header>
  );
}
