import { useState } from "react";

import { cx, initialsOf } from "../../utils/helpers";

/**
 * A person.
 *
 * Falls back to initials on a calm surface when there is no photograph, or
 * when one fails to load — a broken image where a partner's face should be is
 * a small, avoidable unkindness.
 */

export type AvatarSize = "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, string> = {
  sm: "size-8 text-[0.7rem]",
  md: "size-10 text-xs",
  lg: "size-14 text-sm",
};

export interface AvatarProps {
  name: string;
  photoURL?: string | null;
  size?: AvatarSize;
  /** A soft ring, used to mark whose turn it is to be spoken about. */
  ring?: boolean;
  className?: string;
}

export function Avatar({
  name,
  photoURL,
  size = "md",
  ring = false,
  className,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(photoURL) && !failed;

  return (
    <span
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-accent-soft font-medium tracking-wide text-accent-strong uppercase",
        ring && "ring-2 ring-accent/30 ring-offset-2 ring-offset-canvas",
        SIZES[size],
        className,
      )}
      /*
        The name is already announced by the surrounding text everywhere this
        appears, so the avatar itself is decorative to a screen reader.
      */
      aria-hidden
    >
      {showImage ? (
        <img
          src={photoURL as string}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

export interface AvatarPairProps {
  people: Array<{ name: string; photoURL?: string | null }>;
  size?: AvatarSize;
}

/**
 * Two people, overlapping. Used wherever the product speaks about the pair
 * rather than about either person.
 */
export function AvatarPair({ people, size = "sm" }: AvatarPairProps) {
  return (
    <span className="flex items-center -space-x-2">
      {people.map((person, index) => (
        <Avatar
          key={`${person.name}-${index}`}
          name={person.name}
          photoURL={person.photoURL}
          size={size}
          className="ring-2 ring-canvas"
        />
      ))}
    </span>
  );
}
