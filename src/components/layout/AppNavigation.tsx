import { NavLink } from "react-router-dom";
import { BookOpen, CalendarDays, History, Images, Trees, type LucideIcon } from "lucide-react";

import { ROUTES } from "../../app/constants";
import { cx } from "../../utils/helpers";

/**
 * Navigation.
 *
 * Five destinations, and no more. Every one of them is somewhere a person
 * might genuinely want to be — there is no inbox, no activity feed and nothing
 * that exists to bring somebody back.
 *
 * The world is always first, because everything else exists to support it.
 */

interface Destination {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Read by assistive technology in place of the short visible label. */
  description: string;
}

const DESTINATIONS: readonly Destination[] = [
  {
    to: ROUTES.world,
    label: "World",
    icon: Trees,
    description: "Your shared world and today's rituals",
  },
  {
    to: ROUTES.dashboard,
    label: "Growth",
    icon: CalendarDays,
    description: "Progress, reflections and shared plans",
  },
  {
    to: ROUTES.journal,
    label: "Co-journal",
    icon: BookOpen,
    description: "Your shared co-journal and daily moods",
  },
  {
    to: ROUTES.memories,
    label: "Memories",
    icon: Images,
    description: "Moments the two of you have kept",
  },
  {
    to: ROUTES.timeline,
    label: "Timeline",
    icon: History,
    description: "The moments that have marked your journey",
  },
] as const;

const LINK_BASE =
  "group relative flex items-center gap-2.5 rounded-full text-sm font-medium " +
  "transition-colors duration-300 ease-(--ease-calm)";

/**
 * The horizontal navigation shown from the medium breakpoint upward.
 */
export function AppNavigation() {
  return (
    <nav aria-label="Sections" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {DESTINATIONS.map(({ to, label, icon: Icon, description }) => (
          <li key={to}>
            <NavLink
              to={to}
              title={description}
              className={({ isActive }) =>
                cx(
                  LINK_BASE,
                  "px-4 py-2",
                  isActive
                    ? "bg-accent-soft text-accent-strong"
                    : "text-ink-soft hover:bg-surface-sunken hover:text-ink",
                )
              }
            >
              <Icon aria-hidden className="size-4" strokeWidth={1.6} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The navigation shown on small screens, anchored to the bottom of the
 * viewport where a thumb can actually reach it.
 */
export function AppNavigationBar() {
  return (
    <nav
      aria-label="Sections"
      className={cx(
        "fixed inset-x-0 bottom-0 z-30 md:hidden",
        "border-t border-line bg-surface/85 backdrop-blur-xl",
        // Clears the home indicator on devices that have one.
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="flex items-stretch justify-around">
        {DESTINATIONS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cx(
                  "flex flex-col items-center gap-1 px-2 pt-3 pb-2.5 text-[0.7rem] font-medium",
                  "transition-colors duration-300 ease-(--ease-calm)",
                  isActive ? "text-accent-strong" : "text-ink-faint",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    aria-hidden
                    className="size-5"
                    strokeWidth={isActive ? 1.9 : 1.5}
                  />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
