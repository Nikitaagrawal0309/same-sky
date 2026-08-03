import {
  BookOpen,
  Brain,
  Droplet,
  Dumbbell,
  Flower2,
  Footprints,
  Gift,
  GraduationCap,
  Heart,
  Moon,
  Palette,
  PenLine,
  Phone,
  PhoneOff,
  Pill,
  Salad,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Target,
  Utensils,
  Wine,
  type LucideIcon,
} from "lucide-react";

import type { RitualIconName } from "../../types/ritual";
import { cx } from "../../utils/helpers";

/**
 * Icons.
 *
 * The catalogue in `services/ritual.ts` stores icon *names* so that it stays
 * free of React. This is the one place a name becomes something drawn, which
 * also means swapping the icon set is a single-file change.
 */

const RITUAL_ICONS: Record<RitualIconName, LucideIcon> = {
  sunrise: Sunrise,
  moon: Moon,
  droplet: Droplet,
  salad: Salad,
  dumbbell: Dumbbell,
  footprints: Footprints,
  pill: Pill,
  flower: Flower2,
  brain: Brain,
  book: BookOpen,
  pen: PenLine,
  sparkle: Sparkles,
  "phone-off": PhoneOff,
  graduation: GraduationCap,
  target: Target,
  palette: Palette,
  sun: Sun,
  stars: Star,
  heart: Heart,
  utensils: Utensils,
  phone: Phone,
  wine: Wine,
  gift: Gift,
};

export interface RitualIconProps {
  name: RitualIconName;
  className?: string;
}

export function RitualIcon({ name, className }: RitualIconProps) {
  const Drawn = RITUAL_ICONS[name];

  /*
    Icons here always accompany a visible label, so they are decorative. An
    icon that repeats the word beside it is noise in a screen reader.
  */
  return <Drawn aria-hidden className={cx("size-5", className)} strokeWidth={1.5} />;
}

export interface SpinnerProps {
  /** Announced to assistive technology while work is in progress. */
  label?: string;
  className?: string;
}

/**
 * A resting indicator.
 *
 * Deliberately slow — a fast spinner communicates urgency, and nothing in
 * Same Sky is urgent.
 */
export function Spinner({ label = "Loading", className }: SpinnerProps) {
  return (
    <span role="status" className={cx("inline-flex items-center gap-3", className)}>
      <span
        aria-hidden
        className="size-4 rounded-full border-2 border-ink-faint border-r-transparent motion-safe:animate-spin [animation-duration:1.1s]"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
