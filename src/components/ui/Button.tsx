import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

import { cx } from "../../utils/helpers";

/**
 * The button.
 *
 * Every action in Same Sky is pressed through this component, which is what
 * keeps a product with this many surfaces feeling like one thing. Buttons here
 * are quiet: generous padding, soft radii, and a press that settles rather
 * than snaps.
 */

export type ButtonVariant = "primary" | "quiet" | "ghost" | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "relative inline-flex items-center justify-center gap-2.5 font-medium " +
  "rounded-full select-none whitespace-nowrap " +
  "transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-(--ease-calm) " +
  "active:scale-[0.985] " +
  "disabled:pointer-events-none disabled:opacity-45";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-contrast shadow-soft hover:bg-accent-strong hover:shadow-lifted",
  quiet:
    "bg-surface text-ink border border-line hover:border-line-strong hover:bg-surface-sunken",
  ghost: "text-ink-soft hover:text-ink hover:bg-surface-sunken",
  danger:
    "bg-surface text-ember border border-ember/30 hover:bg-ember-soft hover:border-ember/50",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.95rem]",
  lg: "h-13 px-8 text-base",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the width of the container. */
  block?: boolean;
  /** Rendered before the label. */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export interface ButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> {
  /**
   * Replaces the label with a resting indicator and blocks interaction.
   * The button keeps its width so the layout never jumps mid-action.
   */
  loading?: boolean;

  /** Shown in place of `children` while `loading`. */
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    block = false,
    icon,
    loading = false,
    loadingLabel,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(BASE, VARIANTS[variant], SIZES[size], block && "w-full", className)}
      {...rest}
    >
      {loading ? (
        <>
          <span
            aria-hidden
            className="size-3.5 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin"
          />
          {loadingLabel ?? children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
});

export interface ButtonLinkProps extends CommonProps {
  to: string;
  /** Replace the current entry rather than pushing a new one. */
  replace?: boolean;
}

/**
 * A button that navigates.
 *
 * A real anchor, so it can be opened in a new tab and read correctly by
 * assistive technology — visual sameness is never worth breaking that.
 */
export function ButtonLink({
  to,
  replace,
  variant = "primary",
  size = "md",
  block = false,
  icon,
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      replace={replace}
      className={cx(BASE, VARIANTS[variant], SIZES[size], block && "w-full", className)}
    >
      {icon}
      {children}
    </Link>
  );
}
