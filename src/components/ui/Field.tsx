import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { cx } from "../../utils/helpers";

/**
 * Form fields.
 *
 * Every input in Same Sky is labelled, described and error-linked through
 * these components. Doing it here once means it cannot be forgotten in the
 * twentieth form, and it is why the product is navigable by keyboard and
 * screen reader without any screen having to think about it.
 */

const CONTROL =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink " +
  "placeholder:text-ink-faint " +
  "transition-[border-color,background-color] duration-200 ease-(--ease-calm) " +
  "hover:border-line-strong " +
  "focus:border-accent focus:outline-none focus-visible:outline-none " +
  "disabled:opacity-50";

interface FieldShellProps {
  label: string;

  /** Guidance shown before anything has gone wrong. */
  hint?: string;

  /** Shown instead of the hint, and announced when it appears. */
  error?: string | null;

  /**
   * Hides the label visually while leaving it available to assistive
   * technology. Use only where the surrounding context makes it obvious.
   */
  hideLabel?: boolean;

  children: (ids: { id: string; describedBy: string | undefined }) => ReactNode;

  className?: string;
}

function FieldShell({
  label,
  hint,
  error,
  hideLabel = false,
  children,
  className,
}: FieldShellProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label
        htmlFor={id}
        className={cx(
          "text-sm font-medium text-ink-soft",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>

      {children({ id, describedBy: message ? messageId : undefined })}

      {message ? (
        <p
          id={messageId}
          /*
            Errors are announced when they appear; hints are not, because a
            hint interrupting someone mid-sentence is noise.
          */
          role={error ? "alert" : undefined}
          className={cx("text-sm", error ? "text-ember" : "text-ink-faint")}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  label: string;
  hint?: string;
  error?: string | null;
  hideLabel?: boolean;
  className?: string;
  inputClassName?: string;
}

export function TextField({
  label,
  hint,
  error,
  hideLabel,
  className,
  inputClassName,
  ...rest
}: TextFieldProps) {
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      className={className}
    >
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cx(CONTROL, error && "border-ember", inputClassName)}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> {
  label: string;
  hint?: string;
  error?: string | null;
  hideLabel?: boolean;
  className?: string;

  /** Shows a remaining-character count once the limit is close. */
  maxLength?: number;
}

export function TextAreaField({
  label,
  hint,
  error,
  hideLabel,
  className,
  maxLength,
  value,
  ...rest
}: TextAreaFieldProps) {
  const length = typeof value === "string" ? value.length : 0;

  /*
    A counter that is always visible turns writing into a measurement. It only
    appears once there is genuinely something to know.
  */
  const showCount = maxLength !== undefined && length > maxLength * 0.75;

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      className={className}
    >
      {({ id, describedBy }) => (
        <div className="relative">
          <textarea
            id={id}
            value={value}
            maxLength={maxLength}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={cx(
              CONTROL,
              "min-h-32 resize-none leading-relaxed",
              error && "border-ember",
            )}
            {...rest}
          />

          {showCount ? (
            <span
              aria-hidden
              className="pointer-events-none absolute right-3 bottom-2.5 text-xs tabular-nums text-ink-faint"
            >
              {maxLength - length}
            </span>
          ) : null}
        </div>
      )}
    </FieldShell>
  );
}

export interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * A switch for a setting that takes effect immediately.
 *
 * Built on a real checkbox so that keyboard, form semantics and assistive
 * technology all work without being reimplemented.
 */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="flex items-start justify-between gap-6 py-1">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[0.95rem] text-ink">
          {label}
        </label>

        {description ? (
          <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-ink-soft">
            {description}
          </p>
        ) : null}
      </div>

      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-describedby={description ? descriptionId : undefined}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />

        <span
          aria-hidden
          className={cx(
            "flex h-6 w-11 items-center rounded-full p-0.5",
            "transition-colors duration-300 ease-(--ease-calm)",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-accent",
            checked ? "bg-accent" : "bg-line-strong",
            disabled && "opacity-45",
          )}
        >
          <span
            className={cx(
              "size-5 rounded-full bg-surface shadow-soft",
              "transition-transform duration-300 ease-(--ease-settle)",
              checked && "translate-x-5",
            )}
          />
        </span>
      </span>
    </div>
  );
}
