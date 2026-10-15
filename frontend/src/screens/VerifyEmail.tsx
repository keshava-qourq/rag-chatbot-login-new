// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

const { Button, Input, Label } = UI;
const { Check, Clock, Upload, ArrowRight, AlertCircle, CheckCircle } = Icons;

const ACCOUNT = {
  email: 'marguerite.okafor@northgate.co.uk',
  created_at: '15 October 2026',
  original_sent_at: '09:12',
  original_expired_at: '10:12',
  link_minutes: 60,
};

const QUOTA = {
  document_count: 0,
  document_limit: 20,
  storage_used: '0 MB',
  storage_limit: '200 MB',
  messages_this_month: 0,
  message_limit: 200,
};

const INBOX_TIPS = [
  'Look in spam or promotions — verification mail lands there more often than anywhere else.',
  'Check the address above for a typo. You can correct it here without starting the signup again.',
  'Some corporate mail servers hold new senders for two or three minutes before delivering.',
];

const rgba = (hex, a) => {
  const h = String(hex).replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clockAt = (d) =>
  d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const plusMinutes = (d, m) => new Date(d.getTime() + m * 60000);

export default function Screen() {
  const navigate = useNavigate();
  const [phase, setPhase] = React.useState('checking'); // checking | expired | sent | failed | limited | verified
  const [busy, setBusy] = React.useState(false);
  const [email, setEmail] = React.useState(ACCOUNT.email);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(ACCOUNT.email);
  const [fieldError, setFieldError] = React.useState('');
  const [attempts, setAttempts] = React.useState(0);
  const [delivered, setDelivered] = React.useState(0);
  const [cooldown, setCooldown] = React.useState(0);
  const [lastSent, setLastSent] = React.useState(null);

  const timers = React.useRef([]);
  const headingRef = React.useRef(null);
  const mounted = React.useRef(false);

  const after = (ms, fn) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };

  React.useEffect(() => {
    after(1600, () => setPhase('expired'));
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown > 0]);

  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (headingRef.current) headingRef.current.focus();
  }, [phase]);

  const sendLink = (toAddress) => {
    setBusy(true);
    after(1000, () => {
      const nextAttempt = attempts + 1;
      setAttempts(nextAttempt);
      setBusy(false);
      if (delivered >= 3) {
        setPhase('limited');
        return;
      }
      if (nextAttempt === 2) {
        setPhase('failed');
        return;
      }
      const now = new Date();
      setLastSent({ at: clockAt(now), expires: clockAt(plusMinutes(now, ACCOUNT.link_minutes)), to: toAddress });
      setDelivered((d) => d + 1);
      setCooldown(30);
      setPhase('sent');
    });
  };

  const checkAgain = () => {
    setPhase('checking');
    after(1500, () => setPhase(delivered > 0 ? 'verified' : 'expired'));
  };

  const saveAddress = (e) => {
    e.preventDefault();
    const value = draft.trim();
    if (!EMAIL_RE.test(value)) {
      setFieldError("That doesn't look like an email address — check for a missing @ or a typo in the domain.");
      return;
    }
    setFieldError('');
    setEmail(value);
    setEditing(false);
    sendLink(value);
  };

  const line = rgba(brand.neutralColor, 0.2);
  const surface = 'rgba(255,255,255,0.72)';
  const quiet = { color: brand.neutralColor };
  const nums = { fontVariantNumeric: 'tabular-nums' };

  const css = `
    @keyframes rrSweep { 0% { left: -36%; } 100% { left: 100%; } }
    @keyframes rrEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes rrBreathe { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
    .rr-sweep { animation: rrSweep 1.3s ease-in-out infinite; }
    .rr-enter { animation: rrEnter .34s ease-out both; }
    .rr-breathe { animation: rrBreathe 1.8s ease-in-out infinite; }
    .rr-focus:focus-visible { outline: 2px solid var(--rr-accent); outline-offset: 3px; }
    .rr-link { text-underline-offset: 3px; }
    @media (prefers-reduced-motion: reduce) {
      .rr-sweep, .rr-enter, .rr-breathe { animation: none !important; }
      .rr-sweep { left: 0; width: 100% !important; opacity: .45; }
    }
  `;

  const Pill = ({ icon: Icon, text, tone }) => {
    const c = tone === 'good' ? brand.primaryColor : tone === 'warn' ? brand.accentColor : brand.neutralColor;
    return (
      <span
        className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
        style={{ color: c, backgroundColor: rgba(c, 0.1), borderRadius: brand.radius }}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {text}
      </span>
    );
  };

  const Quote = ({ children }) => (
    <div className="my-7 pl-5" style={{ borderLeft: `2px solid ${rgba(brand.accentColor, 0.5)}` }}>
      {children}
    </div>
  );

  const primaryBtn = {
    backgroundColor: brand.primaryColor,
    color: brand.backgroundColor,
    borderRadius: brand.radius,
  };

  const ghostBtn = {
    color: brand.primaryColor,
    borderColor: line,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: brand.radius,
    backgroundColor: 'transparent',
  };

  const addressForm = (
    <form onSubmit={saveAddress} className="mt-6 p-5 rr-enter" style={{ backgroundColor: rgba(brand.neutralColor, 0.07), borderRadius: brand.radius }}>
      <Label htmlFor="verify-email" className="block text-sm font-semibold" style={{ color: brand.primaryColor }}>
        Where should we send the link?
      </Label>
      <p className="mt-1 text-sm" style={quiet}>
        Changing this updates the address on your account before we send.
      </p>
      <Input
        id="verify-email"
        type="email"
        value={draft}
        autoComplete="email"
        onChange={(e) => setDraft(e.target.value)}
        aria-invalid={fieldError ? 'true' : 'false'}
        aria-describedby={fieldError ? 'verify-email-error' : undefined}
        className="rr-focus mt-3 w-full px-3 py-2 text-base"
        style={{
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: brand.radius,
          border: `1px solid ${fieldError ? brand.accentColor : line}`,
          color: brand.primaryColor,
        }}
      />
      {fieldError ? (
        <p id="verify-email-error" role="alert" className="mt-2 flex items-start gap-2 text-sm" style={{ color: brand.accentColor }}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{fieldError}</span>
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" className="rr-focus px-4 py-2 text-sm font-semibold" style={primaryBtn}>
          Save and send the link
        </Button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setFieldError('');
            setDraft(email);
          }}
          className="rr-focus px-3 py-2 text-sm font-medium"
          style={{ color: brand.neutralColor, borderRadius: brand.radius }}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  let panel;

  if (phase === 'checking') {
    panel = (
      <div key="checking" className="rr-enter">
        <Pill icon={Clock} text="Checking" tone="neutral" />
        <h2 ref={headingRef} tabIndex={-1} className="rr-focus mt-5 text-2xl font-semibold tracking-tight" style={{ color: brand.primaryColor }}>
          Matching your link to an account
        </h2>
        <p className="mt-3 max-w-prose text-[17px] leading-8" style={quiet}>
          This takes a second or two. Don't close the tab — we'll tell you either way.
        </p>
        <div className="relative mt-8 h-1 w-full overflow-hidden" style={{ backgroundColor: rgba(brand.neutralColor, 0.14), borderRadius: 999 }}>
          <div className="rr-sweep absolute bottom-0 top-0" style={{ width: '34%', backgroundColor: brand.primaryColor, borderRadius: 999 }} />
        </div>
        <p className="rr-breathe mt-4 text-sm" style={{ ...quiet, ...nums }} role="status">
          Verifying token · {email}
        </p>
      </div>
    );
  } else if (phase === 'expired') {
    panel = (
      <div key="expired" className="rr-enter">
        <Pill icon={Clock} text="Link expired" tone="warn" />
        <h2 ref={headingRef} tabIndex={-1} className="rr-focus mt-5 text-2xl font-semibold tracking-tight" style={{ color: brand.primaryColor }}>
          That link has passed its hour
        </h2>
        <p className="mt-3 max-w-prose text-[17px] leading-8" style={quiet}>
          Verification links last {ACCOUNT.link_minutes} minutes, and this one was sent first thing this morning.
          Nothing is wrong with your account — a fresh link will replace the old one straight away.
        </p>
        <Quote>
          <dl className="space-y-2 text-[15px]" style={nums}>
            <div className="flex flex-wrap gap-x-3">
              <dt className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.12em]" style={quiet}>Sent to</dt>
              <dd className="break-all font-medium" style={{ color: brand.primaryColor }}>{email}</dd>
            </div>
            <div className="flex flex-wrap gap-x-3">
              <dt className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.12em]" style={quiet}>Sent</dt>
              <dd style={quiet}>{ACCOUNT.created_at}, {ACCOUNT.original_sent_at}</dd>
            </div>
            <div className="flex flex-wrap gap-x-3">
              <dt className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.12em]" style={quiet}>Expired</dt>
              <dd style={quiet}>{ACCOUNT.created_at}, {ACCOUNT.original_expired_at}</dd>
            </div>
          </dl>
        </Quote>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => sendLink(email)}
            disabled={busy}
            className="rr-focus px-5 py-3 text-base font-semibold"
            style={{ ...primaryBtn, opacity: busy ? 0.65 : 1 }}
          >
            {busy ? 'Sending…' : 'Send me a new link'}
          </Button>
          {!editing ? (
            <button
              type="button"
              onClick={() => { setDraft(email); setEditing(true); }}
              className="rr-focus px-4 py-3 text-sm font-semibold"
              style={ghostBtn}
            >
              Use a different address
            </button>
          ) : null}
        </div>
        {editing ? addressForm : null}
      </div>
    );
  } else if (phase === 'sent') {
    panel = (
      <div key="sent" className="rr-enter">
        <Pill icon={CheckCircle} text="New link sent" tone="good" />
        <h2 ref={headingRef} tabIndex={-1} className="rr-focus mt-5 text-2xl font-semibold tracking-tight" style={{ color: brand.primaryColor }}>
          Check your inbox
        </h2>
        <p className="mt-3 max-w-prose text-[17px] leading-8" style={quiet}>
          A fresh verification link is on its way. Open it on any device — this page will catch up on its own,
          or you can tell it to look now.
        </p>
        <Quote>
          <dl className="space-y-2 text-[15px]" style={nums}>
            <div className="flex flex-wrap gap-x-3">
              <dt className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.12em]" style={quiet}>Sent to</dt>
              <dd className="break-all font-medium" style={{ color: brand.primaryColor }}>{lastSent ? lastSent.to : email}</dd>
            </div>
            <div className="flex flex-wrap gap-x-3">
              <dt className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.12em]" style={quiet}>Sent at</dt>
              <dd style={quiet}>{lastSent ? lastSent.at : '—'} today</dd>
            </div>
            <div className="flex flex-wrap gap-x-3">
              <dt className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.12em]" style={quiet}>Good until</dt>
              <dd style={quiet}>{lastSent ? lastSent.expires : '—'}</dd>
            </div>
          </dl>
        </Quote>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={checkAgain} className="rr-focus px-5 py-3 text-base font-semibold" style={primaryBtn}>
            I've opened the link
          </Button>
          <button
            type="button"
            onClick={() => sendLink(email)}
            disabled={busy || cooldown > 0}
            className="rr-focus px-4 py-3 text-sm font-semibold"
            style={{ ...ghostBtn, opacity: busy || cooldown > 0 ? 0.55 : 1, cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }}
          >
            {busy
              ? 'Sending…'
              : cooldown > 0
                ? `Send another in 0:${String(cooldown).padStart(2, '0')}`
                : 'Send another link'}
          </button>
        </div>
        <p className="mt-4 text-sm" style={{ ...quiet, ...nums }}>
          {delivered} of 3 links sent this hour.
          {!editing ? (
            <>
              {' '}
              <button
                type="button"
                onClick={() => { setDraft(email); setEditing(true); }}
                className="rr-focus rr-link font-semibold underline"
                style={{ color: brand.accentColor }}
              >
                Wrong address?
              </button>
            </>
          ) : null}
        </p>
        {editing ? addressForm : null}
      </div>
    );
  } else if (phase === 'failed') {
    panel = (
      <div key="failed" className="rr-enter">
        <Pill icon={AlertCircle} text="Not sent" tone="warn" />
        <h2 ref={headingRef} tabIndex={-1} className="rr-focus mt-5 text-2xl font-semibold tracking-tight" style={{ color: brand.primaryColor }}>
          The email didn't leave our side
        </h2>
        <p className="mt-3 max-w-prose text-[17px] leading-8" style={quiet}>
          Our mail provider refused the request a moment ago. That's our problem, not your account — your
          address is saved exactly as you left it and nothing has been lost. Try once more; it usually goes
          through on the second attempt.
        </p>
        <Quote>
          <p className="text-[15px]" style={{ ...quiet, ...nums }}>
            {email}
          </p>
          <p className="mt-1 text-sm" style={quiet}>Address on file — still unverified</p>
        </Quote>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => sendLink(email)}
            disabled={busy}
            className="rr-focus px-5 py-3 text-base font-semibold"
            style={{ ...primaryBtn, opacity: busy ? 0.65 : 1 }}
          >
            {busy ? 'Sending…' : 'Try sending again'}
          </Button>
          {!editing ? (
            <button
              type="button"
              onClick={() => { setDraft(email); setEditing(true); }}
              className="rr-focus px-4 py-3 text-sm font-semibold"
              style={ghostBtn}
            >
              Change the address
            </button>
          ) : null}
        </div>
        {editing ? addressForm : null}
      </div>
    );
  } else if (phase === 'limited') {
    panel = (
      <div key="limited" className="rr-enter">
        <Pill icon={AlertCircle} text="Send limit reached" tone="warn" />
        <h2 ref={headingRef} tabIndex={-1} className="rr-focus mt-5 text-2xl font-semibold tracking-tight" style={{ color: brand.primaryColor }}>
          That's three links in an hour
        </h2>
        <p className="mt-3 max-w-prose text-[17px] leading-8" style={quiet}>
          We cap verification emails at three an hour so scripted signups can't run up our costs. You can ask
          for another after the hour turns. The most recent link we sent is still valid — try that one first.
        </p>
        <Quote>
          <dl className="space-y-2 text-[15px]" style={nums}>
            <div className="flex flex-wrap gap-x-3">
              <dt className="w-28 shrink-0 text-xs font-semibold uppercase tracking-[0.12em]" style={quiet}>Last link</dt>
              <dd style={quiet}>sent {lastSent ? lastSent.at : '—'}, good until {lastSent ? lastSent.expires : '—'}</dd>
            </div>
            <div className="flex flex-wrap gap-x-3">
              <dt className="w-28 shrink-0 text-xs font-semibold uppercase tracking-[0.12em]" style={quiet}>Sends used</dt>
              <dd style={quiet}>3 of 3 this hour</dd>
            </div>
          </dl>
        </Quote>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={checkAgain} className="rr-focus px-5 py-3 text-base font-semibold" style={primaryBtn}>
            I've opened the last link
          </Button>
          <button
            type="button"
            onClick={() => navigate('signin')}
            className="rr-focus px-4 py-3 text-sm font-semibold"
            style={ghostBtn}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  } else {
    panel = (
      <div key="verified" className="rr-enter">
        <Pill icon={CheckCircle} text="Verified" tone="good" />
        <h2 ref={headingRef} tabIndex={-1} className="rr-focus mt-5 text-2xl font-semibold tracking-tight" style={{ color: brand.primaryColor }}>
          Your email is verified
        </h2>
        <p className="mt-3 max-w-prose text-[17px] leading-8" style={quiet}>
          <span className="font-medium" style={{ color: brand.primaryColor }}>{email}</span> is confirmed and you're
          signed in. Your library is empty and entirely private — answers are only ever drawn from documents you
          upload yourself, and no other account can reach them.
        </p>
        <Quote>
          <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={quiet}>Your free plan</p>
          <ul className="mt-2 space-y-1 text-[15px]" style={{ ...quiet, ...nums }}>
            <li>{QUOTA.document_count} of {QUOTA.document_limit} documents</li>
            <li>{QUOTA.storage_used} of {QUOTA.storage_limit} stored</li>
            <li>{QUOTA.messages_this_month} of {QUOTA.message_limit} questions this month</li>
          </ul>
        </Quote>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => navigate('library')}
            className="rr-focus inline-flex items-center gap-2 px-5 py-3 text-base font-semibold"
            style={primaryBtn}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload your first document
          </Button>
          <button
            type="button"
            onClick={() => navigate('chat')}
            className="rr-focus inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold"
            style={ghostBtn}
          >
            Go to chat
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-full w-full"
      style={{
        backgroundColor: brand.backgroundColor,
        fontFamily: brand.fontBody,
        '--rr-accent': brand.accentColor,
        '--rr-primary': brand.primaryColor,
      }}
    >
      <style>{css}</style>

      <div className="mx-auto w-full max-w-2xl px-6 py-14 sm:px-8 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: brand.accentColor }}>
          Account setup
        </p>
        <h1
          className="mt-4 text-4xl font-semibold tracking-tight sm:text-[2.75rem] sm:leading-[1.1]"
          style={{ color: brand.primaryColor, fontFamily: brand.fontHeading }}
        >
          Verify your email
        </h1>
        <p className="mt-5 max-w-prose text-[17px] leading-8" style={quiet}>
          One click and your reading room opens. We ask for this so a password reset can always reach you —
          and so nobody else can claim an address that's yours.
        </p>

        {phase !== 'verified' ? (
          <p
            className="mt-8 flex items-start gap-3 px-4 py-3 text-sm leading-6"
            style={{ backgroundColor: rgba(brand.accentColor, 0.09), color: brand.neutralColor, borderRadius: brand.radius }}
          >
            <Clock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: brand.accentColor }} aria-hidden="true" />
            <span>
              <span className="font-semibold" style={{ color: brand.accentColor }}>Paused:</span>{' '}
              uploads and questions stay locked until this address is confirmed.
            </span>
          </p>
        ) : null}

        <section
          aria-live="polite"
          aria-label="Verification status"
          className="mt-8 p-8 sm:p-10"
          style={{
            backgroundColor: surface,
            border: `1px solid ${line}`,
            borderRadius: brand.radius,
            boxShadow: `0 1px 2px ${rgba(brand.neutralColor, 0.08)}`,
          }}
        >
          {panel}
        </section>

        {phase !== 'verified' && phase !== 'checking' ? (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: brand.primaryColor }}>
              If it doesn't arrive
            </h2>
            <ul className="mt-5 space-y-4">
              {INBOX_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-3 text-[15px] leading-7" style={quiet}>
                  <Check className="mt-1 h-4 w-4 shrink-0" style={{ color: brand.accentColor }} aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-12 pt-6" style={{ borderTop: `1px solid ${line}` }}>
          <p className="text-sm leading-7" style={quiet}>
            {phase === 'verified' ? 'Finished for now?' : 'Not your account?'}{' '}
            <button
              type="button"
              onClick={() => navigate('signin')}
              className="rr-focus rr-link font-semibold underline"
              style={{ color: brand.primaryColor }}
            >
              {phase === 'verified' ? 'Sign out' : 'Sign in with a different email'}
            </button>
            {phase !== 'verified' ? (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={() => navigate('reset-password')}
                  className="rr-focus rr-link font-semibold underline"
                  style={{ color: brand.primaryColor }}
                >
                  Reset your password
                </button>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
