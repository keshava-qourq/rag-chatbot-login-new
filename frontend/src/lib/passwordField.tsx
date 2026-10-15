/**
 * Shared password input with a single eye-icon visibility toggle.
 *
 * Used by Signin.tsx (sign-in and create-account tabs) and
 * ResetPassword.tsx (new password and confirm password) so there is exactly
 * one implementation of "show/hide password" in the app -- see US-024-1.
 *
 * Visibility is local component state, initial value hidden (AC-080): every
 * mounted instance owns its own flag, so two password fields on the same
 * screen never share one toggle, and remounting or reloading always starts
 * masked again.
 *
 * Keyboard and screen-reader behaviour (US-025-1):
 *  - The toggle is a native <button type="button">, so Tab reaches it and
 *    both Enter and Space activate it via the platform -- no custom key
 *    handling is attached (AC-082).
 *  - The accessible name comes solely from `aria-label`, which flips between
 *    "Show password" and "Hide password" with the visibility state
 *    (AC-083, AC-084); the eye glyph itself is `aria-hidden`, so it never
 *    contributes to that name.
 *  - The focus-visible ring is built into this component (not left to each
 *    host screen's own CSS) so the same focus treatment applies identically
 *    on sign-up, sign-in and reset-password (AC-085).
 */
import * as React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";

const { Input } = UI;

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Classes for the relative wrapper div (e.g. spacing like "mt-2"). */
  wrapperClassName?: string;
  /** Extra classes for the toggle button, merged after the defaults. */
  toggleClassName?: string;
  /** Inline style for the toggle button -- typically just `color`, to match
   * the host screen's brand tokens. */
  toggleStyle?: React.CSSProperties;
  iconSize?: number;
};

export function PasswordField({
  className,
  style,
  wrapperClassName,
  toggleClassName,
  toggleStyle,
  iconSize = 16,
  ...props
}: PasswordFieldProps) {
  // AC-080: starts hidden, state is local to this instance.
  const [visible, setVisible] = React.useState(false);
  const EyeIcon = visible ? Icons.EyeOff : Icons.Eye;

  return (
    <div className={cx("relative", wrapperClassName)}>
      <Input
        {...props}
        type={visible ? "text" : "password"}
        // Reserve right-hand padding so the icon never overlaps typed text.
        className={cx(className, "pr-10")}
        style={style}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className={cx(
          "rr-focus absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded p-1",
          // Self-contained focus-visible ring (AC-085): identical on every
          // screen that uses this component, independent of whatever
          // focus styling the host screen's own CSS happens to define.
          "focus:outline-none focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[var(--brand-primary,#2F5D50)] focus-visible:ring-offset-1",
          toggleClassName,
        )}
        style={toggleStyle}
      >
        <EyeIcon size={iconSize} aria-hidden="true" />
      </button>
    </div>
  );
}
