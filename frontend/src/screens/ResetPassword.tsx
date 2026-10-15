// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

const { Button, Input, Label, Checkbox, Badge, Separator } = UI;
const { Check, X, Clock, ArrowLeft, AlertCircle, CheckCircle } = Icons;

// ---------------------------------------------------------------------------
// Reset password — route: reset-password
// Serves US-004 (AC-010, AC-011, AC-012)
// ---------------------------------------------------------------------------

const ACCOUNT_EMAIL = "e.mbakare@northfield.org";
const LINK_SENT_AT = "08:41";
const LINK_EXPIRES_AT = "09:41";
const LINK_DATE = "15 October 2026";
const EXPIRED_SENT_AT = "14 October 2026, 17:02";
const EXPIRED_AT = "14 October 2026, 18:02";
const RESEND_COOLDOWN = 45;
const MAX_LINKS_PER_HOUR = 3;
const RATE_WINDOW_CLEARS = "10:26";
const LINK_LIFETIME_MIN = 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WEAK_PATTERN = /(password|qwerty|12345|letmein)/i;

const PASSWORD_RULES = [
  { id: "len", label: "At least 10 characters", test: (v) => v.length >= 10 },
  { id: "num", label: "Includes a number", test: (v) => /\d/.test(v) },
  { id: "alpha", label: "Includes a letter", test: (v) => /[a-zA-Z]/.test(v) },
];

const PREVIEW_STATES = [
  { id: "request", label: "No link yet" },
  { id: "set", label: "Valid link" },
  { id: "expired", label: "Expired link" },
];

function hexToRgb(hex) {
  const clean = String(hex).replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function withAlpha(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shade(hex, factor) {
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

export default function Screen() {
  const navigate = useNavigate();
  const ink = shade(brand.neutralColor, 0.52);
  const muted = brand.neutralColor;
  const hairline = withAlpha(brand.neutralColor, 0.22);
  const paper = "rgba(255, 255, 255, 0.68)";
  const field = "rgba(255, 255, 255, 0.92)";

  const [mode, setMode] = React.useState("request"); // request | sent | set | expired | done
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [sentTo, setSentTo] = React.useState("");
  const [requests, setRequests] = React.useState(0);
  const [cooldown, setCooldown] = React.useState(0);
  const [rateLimited, setRateLimited] = React.useState(false);

  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [pwError, setPwError] = React.useState(null);
  const [pw2Error, setPw2Error] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [signOutOthers, setSignOutOthers] = React.useState(true);

  const [focusField, setFocusField] = React.useState(null);

  const timers = React.useRef([]);
  React.useEffect(
    () => () => timers.current.forEach((t) => clearTimeout(t)),
    []
  );
  const later = (fn, ms) => {
    timers.current.push(setTimeout(fn, ms));
  };

  React.useEffect(() => {
    if (mode !== "sent" || cooldown <= 0) return undefined;
    const id = setInterval(
      () => setCooldown((c) => (c <= 1 ? 0 : c - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [mode, cooldown === 0]);

  const metRules = PASSWORD_RULES.filter((r) => r.test(pw));
  const strength =
    pw.length === 0
      ? "Not set yet"
      : metRules.length < 2
      ? "Too weak"
      : metRules.length < 3
      ? "Almost there"
      : "Meets the rule";

  const fieldStyle = (name) => ({
    backgroundColor: field,
    borderColor:
      focusField === name ? brand.primaryColor : withAlpha(brand.neutralColor, 0.32),
    color: ink,
    borderRadius: brand.radius,
    boxShadow:
      focusField === name
        ? `0 0 0 3px ${withAlpha(brand.primaryColor, 0.16)}`
        : "none",
    transition: "box-shadow .18s ease, border-color .18s ease",
  });

  const primaryBtn = {
    backgroundColor: brand.primaryColor,
    color: "#FFFFFF",
    borderRadius: brand.radius,
    border: `1px solid ${brand.primaryColor}`,
  };
  const quietBtn = {
    backgroundColor: "transparent",
    color: brand.primaryColor,
    borderRadius: brand.radius,
    border: `1px solid ${withAlpha(brand.primaryColor, 0.35)}`,
  };
  const linkBtn = {
    backgroundColor: "transparent",
    color: brand.primaryColor,
    border: "none",
    padding: 0,
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  };

  const panelStyle = {
    backgroundColor: paper,
    border: `1px solid ${hairline}`,
    borderRadius: `calc(${brand.radius} * 1.75)`,
    boxShadow: `0 1px 1px ${withAlpha(brand.primaryColor, 0.05)}, 0 24px 48px -36px ${withAlpha(
      brand.primaryColor,
      0.45
    )}`,
  };

  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // --- actions -------------------------------------------------------------
  function submitRequest(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setEmailError("Enter the email address you signed up with.");
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setEmailError(
        "That doesn’t look like an email address — check for a missing @ or a stray space."
      );
      return;
    }
    setEmailError(null);
    setSending(true);
    later(() => {
      setSending(false);
      setSentTo(value);
      setRequests(1);
      setRateLimited(false);
      setCooldown(RESEND_COOLDOWN);
      setMode("sent");
    }, 900);
  }

  function resend() {
    if (cooldown > 0 || sending) return;
    const next = requests + 1;
    if (next > MAX_LINKS_PER_HOUR) {
      setRateLimited(true);
      return;
    }
    setSending(true);
    later(() => {
      setSending(false);
      setRequests(next);
      setCooldown(RESEND_COOLDOWN);
    }, 800);
  }

  function submitPassword(e) {
    e.preventDefault();
    let bad = false;
    if (metRules.length < PASSWORD_RULES.length) {
      setPwError(
        "Use at least 10 characters with a letter and a number — the three checks below all need a tick."
      );
      bad = true;
    } else if (WEAK_PATTERN.test(pw)) {
      setPwError(
        "That one turns up in known breach lists. Pick something less guessable."
      );
      bad = true;
    } else {
      setPwError(null);
    }
    if (pw2.length === 0) {
      setPw2Error("Type the password a second time so we know it’s what you meant.");
      bad = true;
    } else if (pw !== pw2) {
      setPw2Error("These two don’t match yet.");
      bad = true;
    } else {
      setPw2Error(null);
    }
    if (bad) return;
    setSaving(true);
    later(() => {
      setSaving(false);
      setMode("done");
    }, 950);
  }

  function toPreview(next) {
    setEmailError(null);
    setPwError(null);
    setPw2Error(null);
    setSending(false);
    setSaving(false);
    if (next === "request") {
      setMode("request");
      setEmail("");
      setSentTo("");
      setRequests(0);
      setCooldown(0);
      setRateLimited(false);
    } else if (next === "set") {
      setPw("");
      setPw2("");
      setShowPw(false);
      setSignOutOthers(true);
      setMode("set");
    } else {
      setMode("expired");
    }
  }

  const toggleSignOut = (e) => {
    const v =
      typeof e === "boolean"
        ? e
        : e && e.target
        ? e.target.checked
        : !signOutOthers;
    setSignOutOthers(v);
  };

  const label = "text-[0.72rem] font-semibold uppercase tracking-[0.16em]";

  // --- panels --------------------------------------------------------------
  const requestPanel = (
    <div className="p-7 sm:p-10">
      <h2
        className="text-xl sm:text-2xl font-semibold tracking-tight"
        style={{ color: brand.primaryColor, fontFamily: brand.fontHeading }}
      >
        Send me a reset link
      </h2>
      <p className="mt-3 max-w-prose text-[0.975rem] leading-7" style={{ color: muted }}>
        We’ll email a single-use link. It stays valid for {LINK_LIFETIME_MIN} minutes,
        and opening it lets you set a new password without needing the old one.
      </p>

      <form className="mt-8" onSubmit={submitRequest} noValidate>
        <Label htmlFor="reset-email" className={label} style={{ color: ink }}>
          Email address
        </Label>
        <Input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocusField("email")}
          onBlur={() => setFocusField(null)}
          aria-invalid={emailError ? "true" : "false"}
          aria-describedby={emailError ? "reset-email-error" : "reset-email-hint"}
          placeholder="you@work-address.com"
          className="mt-2 w-full px-3.5 py-2.5 text-[1rem]"
          style={fieldStyle("email")}
        />
        {emailError ? (
          <p
            id="reset-email-error"
            role="alert"
            className="mt-2.5 flex items-start gap-2 text-[0.875rem] leading-6"
            style={{ color: brand.accentColor }}
          >
            <Icons.AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{emailError}</span>
          </p>
        ) : (
          <p
            id="reset-email-hint"
            className="mt-2.5 text-[0.875rem] leading-6"
            style={{ color: muted }}
          >
            The link goes to this address and nowhere else.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="submit"
            disabled={sending}
            className="w-full px-6 py-3 text-[1rem] font-semibold sm:w-auto"
            style={{ ...primaryBtn, opacity: sending ? 0.72 : 1 }}
          >
            {sending ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="rr-dot inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "#FFFFFF" }}
                  aria-hidden="true"
                />
                Sending the link…
              </span>
            ) : (
              "Email me a reset link"
            )}
          </Button>
          <Button
            type="button"
            onClick={() => navigate("signin")}
            className="w-full px-5 py-3 text-[0.95rem] font-medium sm:w-auto"
            style={quietBtn}
          >
            I remembered it — sign in
          </Button>
        </div>
      </form>

      <Separator className="my-8" style={{ backgroundColor: hairline }} />

      <figure className="pl-5" style={{ borderLeft: `2px solid ${brand.accentColor}` }}>
        <blockquote className="text-[0.95rem] leading-7" style={{ color: ink }}>
          “Whatever you type, the next screen says the same thing. We never reveal
          which addresses have an account here — not to you, and not to anyone
          testing a list of addresses against the form.”
        </blockquote>
        <figcaption className={`mt-2 ${label}`} style={{ color: muted }}>
          Why the confirmation is vague
        </figcaption>
      </figure>
    </div>
  );

  const sentPanel = (
    <div className="p-7 sm:p-10">
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          backgroundColor: withAlpha(brand.primaryColor, 0.1),
          color: brand.primaryColor,
        }}
      >
        <Icons.CheckCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2
        className="mt-5 text-xl sm:text-2xl font-semibold tracking-tight"
        style={{ color: brand.primaryColor, fontFamily: brand.fontHeading }}
      >
        Check that inbox
      </h2>
      <p className="mt-3 max-w-prose text-[0.975rem] leading-7" style={{ color: muted }}>
        If <span style={{ color: ink, fontWeight: 600 }}>{sentTo}</span> has an account
        with us, a link to set a new password is on its way. It can be used once and
        expires {LINK_LIFETIME_MIN} minutes after it was sent.
      </p>

      <dl
        className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <div>
          <dt className={label} style={{ color: muted }}>
            Sent at
          </dt>
          <dd className="mt-1 text-[0.95rem]" style={{ color: ink }}>
            {LINK_SENT_AT} · {LINK_DATE}
          </dd>
        </div>
        <div>
          <dt className={label} style={{ color: muted }}>
            Expires at
          </dt>
          <dd className="mt-1 text-[0.95rem]" style={{ color: ink }}>
            {LINK_EXPIRES_AT} · {LINK_DATE}
          </dd>
        </div>
        <div>
          <dt className={label} style={{ color: muted }}>
            Links this hour
          </dt>
          <dd className="mt-1 text-[0.95rem]" style={{ color: ink }}>
            {requests} of {MAX_LINKS_PER_HOUR}
          </dd>
        </div>
        <div>
          <dt className={label} style={{ color: muted }}>
            Delivered by
          </dt>
          <dd className="mt-1 text-[0.95rem]" style={{ color: ink }}>
            Resend · no-reply mailbox
          </dd>
        </div>
      </dl>

      {rateLimited ? (
        <div
          className="rr-rise mt-7 p-5"
          role="alert"
          style={{
            borderLeft: `3px solid ${brand.accentColor}`,
            backgroundColor: withAlpha(brand.accentColor, 0.07),
            borderRadius: brand.radius,
          }}
        >
          <p
            className="flex items-center gap-2 text-[0.95rem] font-semibold"
            style={{ color: brand.accentColor }}
          >
            <Icons.AlertCircle className="h-4 w-4" aria-hidden="true" />
            That’s three links in an hour
          </p>
          <p className="mt-2 text-[0.9rem] leading-7" style={{ color: ink }}>
            We pause reset emails after three requests so nobody can flood a
            mailbox. You can ask for another at{" "}
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
              {RATE_WINDOW_CLEARS}
            </span>
            . Any of the links already sent still works until it expires.
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || sending || rateLimited}
          className="w-full px-5 py-3 text-[0.95rem] font-semibold sm:w-auto"
          style={{
            ...quietBtn,
            opacity: cooldown > 0 || sending || rateLimited ? 0.55 : 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {sending
            ? "Sending…"
            : cooldown > 0
            ? `Send again in ${mmss(cooldown)}`
            : "Send the link again"}
        </Button>
        <Button
          type="button"
          onClick={() => {
            setEmail(sentTo);
            setMode("request");
          }}
          className="w-full px-5 py-3 text-[0.95rem] font-medium sm:w-auto"
          style={{ ...quietBtn, borderColor: hairline, color: ink }}
        >
          Use a different address
        </Button>
      </div>

      <p className="mt-6 text-[0.875rem] leading-6" style={{ color: muted }}>
        Nothing after a few minutes? Look in spam and promotions, and check the
        address above for a typo.{" "}
        <button type="button" onClick={() => navigate("signin")} style={linkBtn}>
          Back to sign in
        </button>
      </p>
    </div>
  );

  const setPanel = (
    <div className="p-7 sm:p-10">
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em]"
          style={{
            backgroundColor: withAlpha(brand.primaryColor, 0.1),
            color: brand.primaryColor,
            borderRadius: brand.radius,
          }}
        >
          <Icons.Check className="h-3.5 w-3.5" aria-hidden="true" />
          Link verified
        </Badge>
        <span
          className="inline-flex items-center gap-1.5 text-[0.85rem]"
          style={{ color: muted, fontVariantNumeric: "tabular-nums" }}
        >
          <Icons.Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Expires {LINK_EXPIRES_AT} today
        </span>
      </div>

      <h2
        className="mt-5 text-xl sm:text-2xl font-semibold tracking-tight"
        style={{ color: brand.primaryColor, fontFamily: brand.fontHeading }}
      >
        Choose a new password
      </h2>
      <p className="mt-3 max-w-prose text-[0.975rem] leading-7" style={{ color: muted }}>
        For <span style={{ color: ink, fontWeight: 600 }}>{ACCOUNT_EMAIL}</span>. Once
        you save it, this link stops working and your documents and conversations are
        reachable again.
      </p>

      <form className="mt-8" onSubmit={submitPassword} noValidate>
        <div className="flex items-baseline justify-between gap-4">
          <Label htmlFor="new-password" className={label} style={{ color: ink }}>
            New password
          </Label>
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="text-[0.8rem] font-semibold"
            style={linkBtn}
          >
            {showPw ? "Hide password" : "Show password"}
          </button>
        </div>
        <Input
          id="new-password"
          name="password"
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onFocus={() => setFocusField("pw")}
          onBlur={() => setFocusField(null)}
          aria-invalid={pwError ? "true" : "false"}
          aria-describedby={`pw-rules pw-strength${pwError ? " pw-error" : ""}`}
          className="mt-2 w-full px-3.5 py-2.5 text-[1rem]"
          style={fieldStyle("pw")}
        />

        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-1.5 w-full max-w-[14rem] overflow-hidden"
            style={{
              backgroundColor: withAlpha(brand.neutralColor, 0.18),
              borderRadius: "999px",
            }}
            aria-hidden="true"
          >
            <div
              className="h-full"
              style={{
                width: `${(metRules.length / PASSWORD_RULES.length) * 100}%`,
                backgroundColor:
                  metRules.length === PASSWORD_RULES.length
                    ? brand.primaryColor
                    : brand.accentColor,
                borderRadius: "999px",
                transition: "width .25s ease",
              }}
            />
          </div>
          <p
            id="pw-strength"
            aria-live="polite"
            className="text-[0.82rem] font-semibold"
            style={{ color: muted }}
          >
            {strength}
          </p>
        </div>

        <ul id="pw-rules" className="mt-4 space-y-2">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(pw);
            return (
              <li
                key={rule.id}
                className="flex items-center gap-2 text-[0.9rem]"
                style={{ color: ok ? brand.primaryColor : muted }}
              >
                {ok ? (
                  <Icons.Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Icons.X className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {rule.label}
                  <span className="sr-only">{ok ? " — met" : " — not met yet"}</span>
                </span>
              </li>
            );
          })}
        </ul>

        {pwError ? (
          <p
            id="pw-error"
            role="alert"
            className="rr-rise mt-4 flex items-start gap-2 text-[0.875rem] leading-6"
            style={{ color: brand.accentColor }}
          >
            <Icons.AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{pwError}</span>
          </p>
        ) : null}

        <div className="mt-7">
          <Label htmlFor="confirm-password" className={label} style={{ color: ink }}>
            Type it again
          </Label>
          <Input
            id="confirm-password"
            name="password_confirm"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            onFocus={() => setFocusField("pw2")}
            onBlur={() => setFocusField(null)}
            aria-invalid={pw2Error ? "true" : "false"}
            aria-describedby={pw2Error ? "pw2-error" : undefined}
            className="mt-2 w-full px-3.5 py-2.5 text-[1rem]"
            style={fieldStyle("pw2")}
          />
          {pw2Error ? (
            <p
              id="pw2-error"
              role="alert"
              className="rr-rise mt-2.5 flex items-start gap-2 text-[0.875rem] leading-6"
              style={{ color: brand.accentColor }}
            >
              <Icons.AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{pw2Error}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-7 flex items-start gap-3">
          <Checkbox
            id="signout-others"
            checked={signOutOthers}
            onChange={toggleSignOut}
            onCheckedChange={toggleSignOut}
            className="mt-0.5"
            style={{ accentColor: brand.primaryColor }}
          />
          <Label
            htmlFor="signout-others"
            className="text-[0.925rem] leading-6"
            style={{ color: ink }}
          >
            Sign out my other devices
            <span className="block text-[0.85rem]" style={{ color: muted }}>
              Ends every session except this one — worth doing on a shared machine.
            </span>
          </Label>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="submit"
            disabled={saving}
            className="w-full px-6 py-3 text-[1rem] font-semibold sm:w-auto"
            style={{ ...primaryBtn, opacity: saving ? 0.72 : 1 }}
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="rr-dot inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "#FFFFFF" }}
                  aria-hidden="true"
                />
                Saving your password…
              </span>
            ) : (
              "Save new password"
            )}
          </Button>
          <Button
            type="button"
            onClick={() => navigate("signin")}
            className="w-full px-5 py-3 text-[0.95rem] font-medium sm:w-auto"
            style={{ ...quietBtn, borderColor: hairline, color: ink }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );

  const expiredPanel = (
    <div className="p-7 sm:p-10">
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          backgroundColor: withAlpha(brand.accentColor, 0.12),
          color: brand.accentColor,
        }}
      >
        <Icons.AlertCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2
        className="mt-5 text-xl sm:text-2xl font-semibold tracking-tight"
        style={{ color: brand.primaryColor, fontFamily: brand.fontHeading }}
      >
        This link no longer works
      </h2>
      <p className="mt-3 max-w-prose text-[0.975rem] leading-7" style={{ color: muted }}>
        Reset links last {LINK_LIFETIME_MIN} minutes and can only be opened once. This
        one was sent to{" "}
        <span style={{ color: ink, fontWeight: 600 }}>{ACCOUNT_EMAIL}</span> and has
        since expired. Nothing has changed on the account — your old password still
        signs you in.
      </p>

      <dl
        className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <div>
          <dt className={label} style={{ color: muted }}>
            Link issued
          </dt>
          <dd className="mt-1 text-[0.95rem]" style={{ color: ink }}>
            {EXPIRED_SENT_AT}
          </dd>
        </div>
        <div>
          <dt className={label} style={{ color: muted }}>
            Expired
          </dt>
          <dd className="mt-1 text-[0.95rem]" style={{ color: ink }}>
            {EXPIRED_AT}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          onClick={() => {
            setEmail(ACCOUNT_EMAIL);
            setEmailError(null);
            setMode("request");
          }}
          className="w-full px-6 py-3 text-[1rem] font-semibold sm:w-auto"
          style={primaryBtn}
        >
          Send me a fresh link
        </Button>
        <Button
          type="button"
          onClick={() => navigate("signin")}
          className="w-full px-5 py-3 text-[0.95rem] font-medium sm:w-auto"
          style={quietBtn}
        >
          Back to sign in
        </Button>
      </div>
    </div>
  );

  const donePanel = (
    <div className="p-7 sm:p-10">
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          backgroundColor: withAlpha(brand.primaryColor, 0.1),
          color: brand.primaryColor,
        }}
      >
        <Icons.CheckCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2
        className="mt-5 text-xl sm:text-2xl font-semibold tracking-tight"
        style={{ color: brand.primaryColor, fontFamily: brand.fontHeading }}
      >
        Your new password is saved
      </h2>
      <p className="mt-3 max-w-prose text-[0.975rem] leading-7" style={{ color: muted }}>
        Sign in with it now.{" "}
        {signOutOthers
          ? "Every other session has been signed out, so anyone using the old password will be asked for the new one."
          : "Your other signed-in devices were left as they are."}{" "}
        The reset link you used has been retired.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          onClick={() => navigate("signin")}
          className="w-full px-6 py-3 text-[1rem] font-semibold sm:w-auto"
          style={primaryBtn}
        >
          Go to sign in
        </Button>
        <Button
          type="button"
          onClick={() => navigate("library")}
          className="w-full px-5 py-3 text-[0.95rem] font-medium sm:w-auto"
          style={quietBtn}
        >
          Open my document library
        </Button>
      </div>

      <p className="mt-6 text-[0.875rem] leading-6" style={{ color: muted }}>
        Didn’t request this change?{" "}
        <button type="button" onClick={() => navigate("account")} style={linkBtn}>
          Review your account settings
        </button>
        .
      </p>
    </div>
  );

  const panels = {
    request: requestPanel,
    sent: sentPanel,
    set: setPanel,
    expired: expiredPanel,
    done: donePanel,
  };

  const previewActive =
    mode === "sent" ? "request" : mode === "done" ? "set" : mode;

  return (
    <div
      className="rr-screen min-h-full w-full"
      style={{
        backgroundColor: brand.backgroundColor,
        fontFamily: brand.fontBody,
        color: ink,
      }}
    >
      <style>{`
        .rr-screen :focus-visible {
          outline: 2px solid ${brand.primaryColor};
          outline-offset: 2px;
          border-radius: 4px;
        }
        @keyframes rr-rise {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: none; }
        }
        .rr-rise { animation: rr-rise .34s cubic-bezier(.2,.7,.3,1) both; }
        @keyframes rr-pulse {
          0%, 100% { opacity: .3; }
          50% { opacity: 1; }
        }
        .rr-dot { animation: rr-pulse 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rr-rise, .rr-dot { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8 sm:py-16">
        <button
          type="button"
          onClick={() => navigate("signin")}
          className="inline-flex items-center gap-2 text-[0.875rem] font-medium"
          style={{ color: muted, background: "transparent", border: "none", padding: 0 }}
        >
          <Icons.ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Sign in
        </button>

        <p className={`mt-8 ${label}`} style={{ color: brand.accentColor }}>
          Account access
        </p>
        <h1
          className="mt-3 text-3xl sm:text-[2.6rem] font-semibold leading-tight tracking-tight"
          style={{ color: brand.primaryColor, fontFamily: brand.fontHeading }}
        >
          Reset your password
        </h1>
        <p
          className="mt-4 max-w-prose text-[1.0625rem] leading-8"
          style={{ color: muted }}
        >
          Your library and your conversations stay exactly where they are. Only the
          way you get back into them changes.
        </p>

        <section
          key={mode}
          className="rr-rise mt-9"
          style={panelStyle}
          aria-live="polite"
        >
          {panels[mode]}
        </section>

        <section
          aria-labelledby="preview-heading"
          className="mt-10 px-5 py-5"
          style={{
            border: `1px dashed ${withAlpha(brand.neutralColor, 0.35)}`,
            borderRadius: `calc(${brand.radius} * 1.25)`,
          }}
        >
          <h2 id="preview-heading" className={label} style={{ color: muted }}>
            Prototype — link states
          </h2>
          <p className="mt-2 text-[0.875rem] leading-6" style={{ color: muted }}>
            In the built product the state comes from the token in the emailed link.
            Here you can step through each one.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PREVIEW_STATES.map((s) => {
              const active = previewActive === s.id;
              return (
                <Button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toPreview(s.id)}
                  className="px-4 py-2 text-[0.85rem] font-medium"
                  style={{
                    borderRadius: brand.radius,
                    border: `1px solid ${
                      active ? brand.primaryColor : withAlpha(brand.neutralColor, 0.3)
                    }`,
                    backgroundColor: active
                      ? withAlpha(brand.primaryColor, 0.1)
                      : "transparent",
                    color: active ? brand.primaryColor : ink,
                  }}
                >
                  {s.label}
                </Button>
              );
            })}
          </div>
        </section>

        <p className="mt-8 text-[0.85rem] leading-6" style={{ color: muted }}>
          Haven’t verified your email yet?{" "}
          <button type="button" onClick={() => navigate("verify-email")} style={linkBtn}>
            Resend the verification email
          </button>
          .
        </p>
      </div>
    </div>
  );
}
