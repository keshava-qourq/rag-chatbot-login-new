// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

const { Button, Card, CardContent, CardFooter, Input, Label, Checkbox, Badge, Separator } = UI;
const { Check, X, ChevronRight, FileText, Clock, AlertCircle, CheckCircle } = Icons;

const ACCOUNT = {
  email: "maren.hollis@gmail.com",
  email_verified: true,
  verified_on: "9 April 2026",
  created_at: "9 April 2026",
  password_changed: "2 July 2026",
  session_started: "08:46 today",
  conversation_count: 6,
};

const LIMITS = {
  documents: 20,
  storage_bytes: 104857600,
  messages: 200,
  month_reset_at: "1 November 2026",
};

const INITIAL_USAGE = {
  document_count: 11,
  storage_bytes: 68310000,
  messages_this_month: 142,
  checked_at: "09:12",
};

// Each refresh returns the next snapshot; a null entry is a service that did not answer.
const USAGE_SNAPSHOTS = [
  { document_count: 11, storage_bytes: 68310000, messages_this_month: 167, checked_at: "09:41" },
  null,
  { document_count: 12, storage_bytes: 74904000, messages_this_month: 191, checked_at: "09:58" },
  { document_count: 12, storage_bytes: 74904000, messages_this_month: 200, checked_at: "10:12" },
];

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const f = (c) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
};

const tint = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const fmtBytes = (b) => {
  const mb = b / 1048576;
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
};

const STYLES = `
@keyframes rr-rise { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@keyframes rr-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rr-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
.rr-rise { animation: rr-rise 240ms ease-out both; }
.rr-fade { animation: rr-fade 320ms ease-out both; }
.rr-sweep { animation: rr-sweep 1150ms ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .rr-rise, .rr-fade, .rr-sweep { animation: none !important; }
  .rr-t { transition: none !important; }
}
`;

export default function Screen() {
  const navigate = useNavigate();
  const ink = shade(brand.neutralColor, -0.62);
  const muted = brand.neutralColor;
  const paper = "rgba(255, 255, 255, 0.62)";
  const rule = tint(brand.neutralColor, 0.22);

  const [usage, setUsage] = React.useState(INITIAL_USAGE);
  const [phase, setPhase] = React.useState("stale"); // stale | loading | fresh | error
  const [attempt, setAttempt] = React.useState(0);

  const [confirmSignOut, setConfirmSignOut] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [ack, setAck] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);

  const confirmRef = React.useRef(null);
  const deleteButtonRef = React.useRef(null);

  React.useEffect(() => {
    if (phase !== "loading") return undefined;
    const t = setTimeout(() => {
      const snap = USAGE_SNAPSHOTS[Math.min(attempt - 1, USAGE_SNAPSHOTS.length - 1)];
      if (!snap) {
        setPhase("error");
      } else {
        setUsage(snap);
        setPhase("fresh");
      }
    }, 950);
    return () => clearTimeout(t);
  }, [phase, attempt]);

  React.useEffect(() => {
    if (!deleting) return undefined;
    const t = setTimeout(() => setDeleted(true), 1500);
    return () => clearTimeout(t);
  }, [deleting]);

  React.useEffect(() => {
    if (deleteOpen && confirmRef.current) confirmRef.current.focus();
  }, [deleteOpen]);

  const refresh = () => {
    setAttempt((a) => a + 1);
    setPhase("loading");
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setConfirmText("");
    setAck(false);
    setDeleteError(null);
    if (deleteButtonRef.current) deleteButtonRef.current.focus();
  };

  const submitDelete = (e) => {
    e.preventDefault();
    if (confirmText.trim().toLowerCase() !== ACCOUNT.email) {
      setDeleteError(
        `That is not the address on this account. Type ${ACCOUNT.email} exactly as it is written above.`
      );
      return;
    }
    if (!ack) {
      setDeleteError("Tick the box to confirm you understand nothing can be restored.");
      return;
    }
    setDeleteError(null);
    setDeleting(true);
  };

  const msgPct = Math.round((usage.messages_this_month / LIMITS.messages) * 100);
  const docPct = Math.round((usage.document_count / LIMITS.documents) * 100);
  const bytePct = Math.round((usage.storage_bytes / LIMITS.storage_bytes) * 100);
  const remaining = LIMITS.messages - usage.messages_this_month;
  const atLimit = remaining <= 0;
  const nearLimit = !atLimit && msgPct >= 85;
  const metricTone = atLimit || nearLimit ? brand.accentColor : brand.primaryColor;

  const focusRing = {
    "--tw-ring-color": brand.primaryColor,
    "--tw-ring-offset-color": brand.backgroundColor,
  };

  const quietButton =
    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rr-t transition-colors";

  if (deleted) {
    return (
      <div
        className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-8"
        style={{ fontFamily: brand.fontBody, color: ink }}
      >
        <style>{STYLES}</style>
        <div
          className="rr-fade rounded-lg border p-10"
          style={{ borderColor: rule, backgroundColor: paper, borderRadius: brand.radius }}
        >
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: tint(brand.primaryColor, 0.12), color: brand.primaryColor }}
          >
            <Icons.CheckCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1
            className="mt-6 text-3xl leading-tight"
            style={{ fontFamily: brand.fontHeading, letterSpacing: "-0.02em" }}
          >
            Your account has been deleted
          </h1>
          <p className="mt-4 text-[15px] leading-7" style={{ color: muted }}>
            We removed {usage.document_count} documents, {fmtBytes(usage.storage_bytes)} of stored
            files, every embedded passage drawn from them and {ACCOUNT.conversation_count} saved
            conversations. Your session has ended on this device.
          </p>
          <p className="mt-3 text-[15px] leading-7" style={{ color: muted }}>
            Nothing is kept in reserve, so {ACCOUNT.email} is free to start again from scratch
            whenever you like.
          </p>
          <div className="mt-8">
            <Button
              onClick={() => navigate("signin")}
              className="rounded-md px-5 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: brand.primaryColor,
                color: brand.backgroundColor,
                borderRadius: brand.radius,
                ...focusRing,
              }}
            >
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const Meter = ({ labelId, pct, tone, dim }) => (
    <div
      role="progressbar"
      aria-labelledby={labelId}
      aria-valuenow={Math.min(100, pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-[6px] w-full overflow-hidden rounded-full rr-t transition-opacity duration-300"
      style={{ backgroundColor: tint(brand.neutralColor, 0.16), opacity: dim ? 0.5 : 1 }}
    >
      <div
        className="h-full rounded-full rr-t transition-all duration-700 ease-out"
        style={{ width: `${Math.max(2, Math.min(100, pct))}%`, backgroundColor: tone }}
      />
    </div>
  );

  const loading = phase === "loading";

  return (
    <div
      className="mx-auto w-full max-w-3xl px-6 py-12 sm:px-8 lg:py-16"
      style={{ fontFamily: brand.fontBody, color: ink }}
    >
      <style>{STYLES}</style>

      <header>
        <p
          className="text-[11px] font-medium uppercase"
          style={{ color: muted, letterSpacing: "0.18em" }}
        >
          Account
        </p>
        <h1
          className="mt-3 text-3xl leading-tight sm:text-4xl"
          style={{ fontFamily: brand.fontHeading, letterSpacing: "-0.025em" }}
        >
          {ACCOUNT.email}
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-7" style={{ color: muted }}>
          One sign-in, one private library. Your documents, their passages and every conversation
          here are reachable only from this account.
        </p>
      </header>

      {/* ---------------- Usage ---------------- */}
      <section aria-labelledby="usage-heading" className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2
            id="usage-heading"
            className="text-lg"
            style={{ fontFamily: brand.fontHeading, letterSpacing: "-0.01em" }}
          >
            Your free allowance
          </h2>
          <div className="flex items-center gap-3">
            <span
              aria-live="polite"
              className="text-[13px] rr-t transition-colors"
              style={{ color: phase === "error" ? brand.accentColor : muted }}
            >
              {loading
                ? "Checking with the server…"
                : phase === "fresh"
                ? `Checked at ${usage.checked_at}`
                : phase === "error"
                ? `Showing figures from ${usage.checked_at}`
                : `Last checked at ${usage.checked_at}`}
            </span>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className={`${quietButton} disabled:opacity-60`}
              style={{ color: brand.primaryColor, ...focusRing }}
            >
              <Icons.Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {loading ? "Checking" : "Refresh"}
            </button>
          </div>
        </div>

        <Card
          className="mt-4 overflow-hidden border"
          style={{ borderColor: rule, backgroundColor: paper, borderRadius: brand.radius }}
        >
          {loading && (
            <div
              className="h-[3px] w-full overflow-hidden"
              style={{ backgroundColor: tint(brand.neutralColor, 0.12) }}
              aria-hidden="true"
            >
              <div
                className="rr-sweep h-full w-1/3 rounded-full"
                style={{ backgroundColor: brand.primaryColor }}
              />
            </div>
          )}

          <CardContent>
            {phase === "error" && (
              <div
                role="status"
                className="rr-rise mb-7 flex gap-3 rounded-md border p-4"
                style={{
                  borderColor: tint(brand.accentColor, 0.4),
                  backgroundColor: tint(brand.accentColor, 0.07),
                  borderRadius: brand.radius,
                }}
              >
                <Icons.AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: brand.accentColor }}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[14px] font-medium" style={{ color: shade(brand.accentColor, -0.25) }}>
                    The usage service didn&rsquo;t answer
                  </p>
                  <p className="mt-1 text-[13px] leading-6" style={{ color: muted }}>
                    Nothing is wrong with your account — we simply could not read today&rsquo;s
                    counters. The numbers below are from {usage.checked_at} and may have moved since.
                  </p>
                  <button
                    type="button"
                    onClick={refresh}
                    className={`${quietButton} mt-2 -ml-2`}
                    style={{ color: brand.accentColor, ...focusRing }}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Focal metric */}
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div>
                <p
                  id="msg-label"
                  className="text-[11px] font-medium uppercase"
                  style={{ color: muted, letterSpacing: "0.16em" }}
                >
                  Questions asked this month
                </p>
                <p
                  className="mt-3 flex items-baseline gap-2.5 rr-t transition-opacity duration-300"
                  style={{ fontVariantNumeric: "tabular-nums", opacity: loading ? 0.5 : 1 }}
                >
                  <span
                    className="text-5xl leading-none"
                    style={{ color: metricTone, fontWeight: 500, letterSpacing: "-0.03em" }}
                  >
                    {usage.messages_this_month}
                  </span>
                  <span className="text-lg" style={{ color: muted }}>
                    of {LIMITS.messages}
                  </span>
                </p>
              </div>
              <Badge
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
                style={{
                  backgroundColor: atLimit || nearLimit ? tint(brand.accentColor, 0.12) : tint(brand.primaryColor, 0.1),
                  color: atLimit || nearLimit ? shade(brand.accentColor, -0.2) : shade(brand.primaryColor, -0.15),
                  borderRadius: "999px",
                }}
              >
                {atLimit ? (
                  <Icons.AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Icons.Check className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {atLimit ? "Monthly limit reached" : nearLimit ? "Close to the limit" : "Within your allowance"}
              </Badge>
            </div>

            <div className="mt-5">
              <Meter labelId="msg-label" pct={msgPct} tone={metricTone} dim={loading} />
            </div>

            <p className="mt-4 text-[14px] leading-7" style={{ color: muted }}>
              {atLimit ? (
                <>
                  You have used every question in this month&rsquo;s allowance. New questions will be
                  accepted again on <span style={{ color: ink }}>{LIMITS.month_reset_at}</span>, when
                  the counter resets to zero. Reading past answers and citations still works.
                </>
              ) : (
                <>
                  <span style={{ color: ink, fontVariantNumeric: "tabular-nums" }}>{remaining} left</span>{" "}
                  before the counter resets on{" "}
                  <span style={{ color: ink }}>{LIMITS.month_reset_at}</span>.
                </>
              )}
            </p>

            <Separator className="my-7" style={{ backgroundColor: rule }} />

            <dl className="grid gap-7 sm:grid-cols-2">
              <div>
                <dt
                  id="doc-label"
                  className="text-[11px] font-medium uppercase"
                  style={{ color: muted, letterSpacing: "0.16em" }}
                >
                  Documents
                </dt>
                <dd
                  className="mt-2 flex items-baseline gap-2 rr-t transition-opacity duration-300"
                  style={{ fontVariantNumeric: "tabular-nums", opacity: loading ? 0.5 : 1 }}
                >
                  <span className="text-2xl" style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>
                    {usage.document_count}
                  </span>
                  <span className="text-[14px]" style={{ color: muted }}>
                    of {LIMITS.documents}
                  </span>
                </dd>
                <div className="mt-3">
                  <Meter labelId="doc-label" pct={docPct} tone={brand.primaryColor} dim={loading} />
                </div>
                <p className="mt-3 text-[13px] leading-6" style={{ color: muted }}>
                  {usage.document_count === 0
                    ? "Nothing uploaded yet — PDF, DOCX, TXT and Markdown are accepted."
                    : `${LIMITS.documents - usage.document_count} more files can be added.`}
                </p>
              </div>

              <div>
                <dt
                  id="byte-label"
                  className="text-[11px] font-medium uppercase"
                  style={{ color: muted, letterSpacing: "0.16em" }}
                >
                  Storage used
                </dt>
                <dd
                  className="mt-2 flex items-baseline gap-2 rr-t transition-opacity duration-300"
                  style={{ fontVariantNumeric: "tabular-nums", opacity: loading ? 0.5 : 1 }}
                >
                  <span className="text-2xl" style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>
                    {fmtBytes(usage.storage_bytes)}
                  </span>
                  <span className="text-[14px]" style={{ color: muted }}>
                    of {fmtBytes(LIMITS.storage_bytes)}
                  </span>
                </dd>
                <div className="mt-3">
                  <Meter labelId="byte-label" pct={bytePct} tone={brand.primaryColor} dim={loading} />
                </div>
                <p className="mt-3 text-[13px] leading-6" style={{ color: muted }}>
                  Original files plus their extracted passages.
                </p>
              </div>
            </dl>
          </CardContent>

          <CardFooter
            className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4"
            style={{ borderColor: rule }}
          >
            <p className="text-[13px]" style={{ color: muted }}>
              Delete documents you no longer need to free space.
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigate("library")}
                className={quietButton}
                style={{ color: brand.primaryColor, ...focusRing }}
              >
                <Icons.FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Open library
              </button>
              <button
                type="button"
                onClick={() => navigate("chat")}
                className={quietButton}
                style={{ color: brand.primaryColor, ...focusRing }}
              >
                Back to chat
                <Icons.ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </CardFooter>
        </Card>
      </section>

      {/* ---------------- Sign-in details ---------------- */}
      <section aria-labelledby="signin-heading" className="mt-14">
        <h2
          id="signin-heading"
          className="text-lg"
          style={{ fontFamily: brand.fontHeading, letterSpacing: "-0.01em" }}
        >
          Sign-in details
        </h2>

        <Card
          className="mt-4 border"
          style={{ borderColor: rule, backgroundColor: paper, borderRadius: brand.radius }}
        >
          <CardContent>
            <dl className="divide-y" style={{ borderColor: rule }}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 first:pt-0">
                <dt className="text-[13px]" style={{ color: muted }}>
                  Email address
                </dt>
                <dd className="flex items-center gap-2.5 text-[15px]">
                  <span>{ACCOUNT.email}</span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: tint(brand.primaryColor, 0.1),
                      color: shade(brand.primaryColor, -0.15),
                    }}
                  >
                    <Icons.Check className="h-3 w-3" aria-hidden="true" />
                    Verified {ACCOUNT.verified_on}
                  </span>
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                <dt className="text-[13px]" style={{ color: muted }}>
                  Password
                </dt>
                <dd className="flex items-center gap-3 text-[15px]">
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    Last changed {ACCOUNT.password_changed}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("reset-password")}
                    className={`${quietButton} -mr-2`}
                    style={{ color: brand.primaryColor, ...focusRing }}
                  >
                    Change
                  </button>
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                <dt className="text-[13px]" style={{ color: muted }}>
                  Account opened
                </dt>
                <dd className="text-[15px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {ACCOUNT.created_at}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 last:pb-0">
                <dt className="text-[13px]" style={{ color: muted }}>
                  This browser
                </dt>
                <dd className="text-[15px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  Signed in since {ACCOUNT.session_started}
                </dd>
              </div>
            </dl>
          </CardContent>

          <CardFooter className="border-t px-6 py-5" style={{ borderColor: rule }}>
            {confirmSignOut ? (
              <div className="rr-rise flex flex-wrap items-center justify-between gap-4 w-full">
                <p className="text-[14px] leading-6" style={{ color: muted }}>
                  End this session? Your documents and conversations stay exactly as they are.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setConfirmSignOut(false)}
                    className="rounded-md border px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      borderColor: rule,
                      color: ink,
                      backgroundColor: "transparent",
                      borderRadius: brand.radius,
                      ...focusRing,
                    }}
                  >
                    Stay signed in
                  </Button>
                  <Button
                    onClick={() => navigate("signin")}
                    className="rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      backgroundColor: brand.primaryColor,
                      color: brand.backgroundColor,
                      borderRadius: brand.radius,
                      ...focusRing,
                    }}
                  >
                    Sign out now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                <p className="text-[14px] leading-6" style={{ color: muted }}>
                  On a shared machine, sign out to clear the session cookie.
                </p>
                <Button
                  onClick={() => setConfirmSignOut(true)}
                  className="rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    borderColor: tint(brand.primaryColor, 0.45),
                    color: shade(brand.primaryColor, -0.1),
                    backgroundColor: "transparent",
                    borderRadius: brand.radius,
                    ...focusRing,
                  }}
                >
                  Sign out
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </section>

      {/* ---------------- Delete account ---------------- */}
      <section aria-labelledby="delete-heading" className="mt-14 mb-4">
        <h2
          id="delete-heading"
          className="text-lg"
          style={{ fontFamily: brand.fontHeading, letterSpacing: "-0.01em" }}
        >
          Close this account
        </h2>

        <Card
          className="mt-4 border"
          style={{
            borderColor: tint(brand.accentColor, 0.35),
            backgroundColor: tint(brand.accentColor, 0.04),
            borderRadius: brand.radius,
          }}
        >
          <CardContent>
            <p className="max-w-xl text-[15px] leading-7" style={{ color: muted }}>
              Deleting removes everything we hold for you in one pass. There is no archive and no
              support route to bring any of it back.
            </p>

            <ul className="mt-5 space-y-2.5">
              {[
                `${usage.document_count} documents and their original files (${fmtBytes(usage.storage_bytes)})`,
                "Every extracted passage and embedding built from them",
                `${ACCOUNT.conversation_count} saved conversations, their answers and citations`,
                `The sign-in ${ACCOUNT.email} and this month's usage record`,
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[14px] leading-6">
                  <Icons.X
                    className="mt-1 h-3.5 w-3.5 shrink-0"
                    style={{ color: brand.accentColor }}
                    aria-hidden="true"
                  />
                  <span style={{ color: ink }}>{item}</span>
                </li>
              ))}
            </ul>

            {!deleteOpen ? (
              <div className="mt-7">
                <Button
                  ref={deleteButtonRef}
                  onClick={() => setDeleteOpen(true)}
                  className="rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    borderColor: brand.accentColor,
                    color: shade(brand.accentColor, -0.2),
                    backgroundColor: "transparent",
                    borderRadius: brand.radius,
                    "--tw-ring-color": brand.accentColor,
                    "--tw-ring-offset-color": brand.backgroundColor,
                  }}
                >
                  Delete my account…
                </Button>
              </div>
            ) : (
              <form
                onSubmit={submitDelete}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && !deleting) closeDelete();
                }}
                className="rr-rise mt-7 rounded-md border p-5"
                style={{
                  borderColor: tint(brand.accentColor, 0.45),
                  backgroundColor: "rgba(255, 255, 255, 0.72)",
                  borderRadius: brand.radius,
                }}
              >
                <h3 className="text-[15px] font-medium" style={{ fontFamily: brand.fontHeading }}>
                  Confirm deletion
                </h3>
                <p className="mt-2 text-[14px] leading-6" style={{ color: muted }}>
                  Type <span style={{ color: ink }}>{ACCOUNT.email}</span> to confirm.
                </p>

                <div className="mt-4 max-w-sm">
                  <Label htmlFor="confirm-email" className="text-[13px]" style={{ color: muted }}>
                    Your email address
                  </Label>
                  <Input
                    id="confirm-email"
                    ref={confirmRef}
                    type="text"
                    value={confirmText}
                    autoComplete="off"
                    spellCheck="false"
                    disabled={deleting}
                    onChange={(e) => setConfirmText(e.target.value)}
                    aria-invalid={deleteError ? "true" : "false"}
                    aria-describedby={deleteError ? "delete-error" : undefined}
                    placeholder="name@example.com"
                    className="mt-1.5 w-full rounded-md border px-3 py-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      borderColor: deleteError ? brand.accentColor : rule,
                      backgroundColor: brand.backgroundColor,
                      color: ink,
                      borderRadius: brand.radius,
                      "--tw-ring-color": brand.accentColor,
                      "--tw-ring-offset-color": "rgba(255,255,255,0.72)",
                    }}
                  />
                </div>

                <div className="mt-4 flex items-start gap-2.5">
                  <Checkbox
                    id="confirm-ack"
                    checked={ack}
                    disabled={deleting}
                    onCheckedChange={(v) => setAck(typeof v === "boolean" ? v : !ack)}
                    onChange={(e) =>
                      setAck(e && e.target ? e.target.checked : typeof e === "boolean" ? e : !ack)
                    }
                    className="mt-0.5"
                    style={{ accentColor: brand.accentColor }}
                  />
                  <Label htmlFor="confirm-ack" className="text-[14px] leading-6" style={{ color: ink }}>
                    I understand my documents, embeddings and conversations are destroyed and cannot
                    be recovered.
                  </Label>
                </div>

                {deleteError && (
                  <p
                    id="delete-error"
                    role="alert"
                    className="rr-rise mt-4 flex items-start gap-2 text-[13px] leading-6"
                    style={{ color: shade(brand.accentColor, -0.25) }}
                  >
                    <Icons.AlertCircle className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {deleteError}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Button
                    type="submit"
                    disabled={deleting}
                    className="rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-80"
                    style={{
                      backgroundColor: brand.accentColor,
                      color: "rgba(255,255,255,0.98)",
                      borderRadius: brand.radius,
                      "--tw-ring-color": brand.accentColor,
                      "--tw-ring-offset-color": "rgba(255,255,255,0.72)",
                    }}
                  >
                    {deleting ? "Deleting everything…" : "Delete account permanently"}
                  </Button>
                  <Button
                    type="button"
                    onClick={closeDelete}
                    disabled={deleting}
                    className="rounded-md border px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
                    style={{
                      borderColor: rule,
                      color: ink,
                      backgroundColor: "transparent",
                      borderRadius: brand.radius,
                      ...focusRing,
                    }}
                  >
                    Keep my account
                  </Button>
                </div>

                {deleting && (
                  <div className="mt-5" aria-live="polite">
                    <div
                      className="h-[3px] w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: tint(brand.accentColor, 0.18) }}
                      aria-hidden="true"
                    >
                      <div
                        className="rr-sweep h-full w-1/3 rounded-full"
                        style={{ backgroundColor: brand.accentColor }}
                      />
                    </div>
                    <p className="mt-2 text-[13px]" style={{ color: muted }}>
                      Removing files from storage, then passages, then conversations.
                    </p>
                  </div>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
