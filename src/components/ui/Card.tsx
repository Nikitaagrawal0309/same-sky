import type { ElementType, ReactNode } from "react";

import { cx } from "../../utils/helpers";

/**
 * Surfaces.
 *
 * Same Sky uses very little visual weight: a card is a change of surface and
 * a soft edge, not a box with a border and a shadow shouting for attention.
 * Depth is reserved for things that genuinely float above the page.
 */

export type CardTone = "plain" | "sunken" | "outlined";

const TONES: Record<CardTone, string> = {
  plain: "bg-surface shadow-soft",
  sunken: "bg-surface-sunken",
  outlined: "bg-surface border border-line",
};

const PADDING = {
  none: "",
  sm: "p-5",
  md: "p-6 sm:p-8",
  lg: "p-8 sm:p-10",
} as const;

export interface CardProps {
  children: ReactNode;
  tone?: CardTone;
  padding?: keyof typeof PADDING;
  /** Renders as this element instead of a `div`. */
  as?: ElementType;
  className?: string;
}

export function Card({
  children,
  tone = "plain",
  padding = "md",
  as: Element = "div",
  className,
}: CardProps) {
  return (
    <Element className={cx("rounded-2xl", TONES[tone], PADDING[padding], className)}>
      {children}
    </Element>
  );
}

export interface SectionHeadingProps {
  title: string;

  /** A single supporting line. Longer explanations belong in the body. */
  description?: string;

  /** An action aligned to the far end of the heading row. */
  action?: ReactNode;

  /** Heading level, so each screen keeps one honest document outline. */
  level?: 1 | 2 | 3;

  className?: string;
}

export function SectionHeading({
  title,
  description,
  action,
  level = 2,
  className,
}: SectionHeadingProps) {
  const Heading = `h${level}` as ElementType;

  const size =
    level === 1
      ? "text-3xl sm:text-4xl"
      : level === 2
        ? "text-2xl sm:text-[1.75rem]"
        : "text-xl";

  return (
    <div className={cx("flex items-end justify-between gap-6", className)}>
      <div className="min-w-0">
        <Heading className={cx(size, "text-ink")}>{title}</Heading>

        {description ? (
          <p className="mt-2 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;

  /**
   * Why this space is empty, written so that it never reads as a failure to
   * have filled it.
   */
  description: string;

  action?: ReactNode;

  icon?: ReactNode;
}

/**
 * Emptiness, treated as a legitimate state rather than an error.
 */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      {icon ? <div className="mb-6 text-ink-faint">{icon}</div> : null}

      <h3 className="text-xl text-ink">{title}</h3>

      <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-ink-soft">
        {description}
      </p>

      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
