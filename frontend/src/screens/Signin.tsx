// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useQueryClient } from "@tanstack/react-query";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";
import { SESSION_QUERY_KEY } from "@/lib/session";
import {
  ApiError,
  fieldErrorsFromApiError,
  login,
  resendVerification,
  signup,
  TURNSTILE_SITE_KEY,
} from "@/lib/authApi";

const { Button, Card, CardContent, Input, Label, Badge } = UI;
const { Check, X, User, FileText, Upload, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } = Icons;

const ICO = (typeof Icons !== 'undefined' && Icons) || {};

const Nothing = () => null;
const IconCheck = ICO.Check || Nothing;
const IconX = ICO.X || Nothing;
const IconAlert = ICO.AlertCircle || Nothing;
const IconCheckCircle = ICO.CheckCircle || Nothing;
const IconFile = ICO.FileText || Nothing;
const IconArrowRight = ICO.ArrowRight || Nothing;
const IconArrowLeft = ICO.ArrowLeft || Nothing;
const IconUpload = ICO.Upload || Nothing;
const IconUser = ICO.User || Nothing;

const SAMPLE = {
  question: 'How long is the boiler under warranty, and does servicing affect it?',
  answer:
    'Parts and labour are covered for 24 months from the date of installation — but only while the appliance is serviced annually by a qualified engineer.',
  quote:
    'The guarantee period is 24 months from the date of installation, provided the appliance has been serviced every 12 months by a Gas Safe registered engineer and the service record has been completed.',
  source: 'ecoTEC-plus-installation-manual.pdf',
  pageRef: 'page 41',
};

const PROMISES = [
  'Retrieval never leaves your own library — nobody else’s documents are searched, ever.',
  'When your files don’t cover the question, it says so instead of guessing.',
  'PDF, DOCX, TXT and Markdown, extracted and embedded in the background.',
];

const PASSWORD_RULES = [
  { id: 'len', label: 'At least 10 characters', test: (v) => v.length >= 10 },
  { id: 'num', label: 'Contains a number', test: (v) => /\d/.test(v) },
  { id: 'letter', label: 'Contains a letter', test: (v) => /[A-Za-z]/.test(v) },
];

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

export default function Screen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ink = brand.primaryColor;
  const quiet = brand.neutralColor;
  const accent = brand.accentColor;
  const line = brand.neutralColor + '29';
  const radius = brand.radius;

  const [tab, setTab] = React.useState('signin');
  const [notice, setNotice] = React.useState(true);

  // sign in
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [signinFields, setSigninFields] = React.useState({});
  const [signinAlert, setSigninAlert] = React.useState(null);
  const [signinState, setSigninState] = React.useState('idle'); // idle | submitting | success
  const [signinResult, setSigninResult] = React.useState(null);
  const [showPassword, setShowPassword] = React.useState(false);

  // sign up
  const [suEmail, setSuEmail] = React.useState('');
  const [suPassword, setSuPassword] = React.useState('');
  const [turnstileToken, setTurnstileToken] = React.useState('');
  const [turnstileKey, setTurnstileKey] = React.useState(0);
  const [suFields, setSuFields] = React.useState({});
  const [suState, setSuState] = React.useState('idle'); // idle | submitting | sent
  const [sentTo, setSentTo] = React.useState('');
  const [resendCount, setResendCount] = React.useState(0);
  const [resendAt, setResendAt] = React.useState('');
  const [resendError, setResendError] = React.useState(null);

  const tabRefs = { signin: React.useRef(null), signup: React.useRef(null) };

  const css = `
@keyframes rr-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes rr-blink { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
.rr-rise { animation: rr-rise .34s cubic-bezier(.2,.7,.3,1) both; }
.rr-dot { animation: rr-blink 1.1s ease-in-out infinite; }
.rr-dot:nth-child(2) { animation-delay: .18s; }
.rr-dot:nth-child(3) { animation-delay: .36s; }
.rr-focus:focus-visible { outline: 2px solid ${ink}; outline-offset: 2px; }
.rr-underline:hover { text-decoration-thickness: 2px; }
@media (prefers-reduced-motion: reduce) { .rr-rise, .rr-dot { animation: none !important; } }
`;

  const fieldStyle = {
    borderColor: line,
    borderRadius: radius,
    color: quiet,
    fontVariantNumeric: 'tabular-nums',
  };
  const fieldClass =
    'rr-focus w-full border bg-white px-3.5 py-2.5 text-[15px] leading-6 placeholder:opacity-50';

  function selectTab(next) {
    setTab(next);
    setSigninAlert((a) => (next === 'signin' ? a : a));
  }

  function onTabKey(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = tab === 'signin' ? 'signup' : 'signin';
      selectTab(next);
      const el = tabRefs[next].current;
      if (el) el.focus();
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    if (signinState === 'submitting') return;
    const errs = {};
    if (!email.trim()) errs.email = 'Enter the email address you signed up with.';
    else if (!isEmail(email)) errs.email = 'That doesn’t look like an email address — check for a missing @ or domain.';
    if (!password) errs.password = 'Enter your password.';
    setSigninFields(errs);
    setSigninAlert(null);
    if (Object.keys(errs).length) return;

    setSigninState('submitting');
    try {
      const result = await login({ email: email.trim(), password, remember });
      setSigninResult(result);
      setSigninState('success');
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    } catch (err) {
      setSigninState('idle');
      if (err instanceof ApiError && err.status === 401) {
        // Deliberately generic: no hint which of email or password was
        // wrong, and no field-level error either. AC-008.
        setSigninAlert({
          title: 'That email or password is incorrect',
          body:
            'We don’t say which one. It keeps strangers from learning whether an address has a library here.',
        });
      } else {
        setSigninAlert({
          title: 'Something went wrong',
          body: 'We could not sign you in just now. Please try again in a moment.',
        });
      }
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (suState === 'submitting') return;
    const errs = {};
    if (!suEmail.trim()) errs.email = 'We need an email address to send your verification link to.';
    else if (!isEmail(suEmail)) errs.email = 'That doesn’t look like an email address — check for a missing @ or domain.';
    const unmet = PASSWORD_RULES.filter((r) => !r.test(suPassword));
    if (!suPassword) errs.password = 'Choose a password for your account.';
    else if (unmet.length) errs.password = 'Password is too weak: ' + unmet.map((r) => r.label.toLowerCase()).join(', ') + '.';
    if (!turnstileToken) errs.human = 'Complete the human check above before creating your account.';
    setSuFields(errs);
    if (Object.keys(errs).length) return;

    const emailToSend = suEmail.trim();
    setSuState('submitting');
    try {
      await signup({ email: emailToSend, password: suPassword, turnstile_token: turnstileToken });
      setSentTo(emailToSend);
      setResendCount(0);
      setResendError(null);
      setSuState('sent');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // A server rejection for an address already registered gets the same
        // neutral confirmation as a new signup -- no client-side hint that
        // the address exists.
        setSentTo(emailToSend);
        setResendCount(0);
        setResendError(null);
        setSuState('sent');
        return;
      }
      if (err instanceof ApiError && err.status === 422) {
        const fieldErrs = fieldErrorsFromApiError(err);
        setSuFields((f) => ({ ...f, ...fieldErrs }));
        setSuState('idle');
        return;
      }
      setTurnstileToken('');
      setTurnstileKey((k) => k + 1);
      setSuFields({ form: 'Something went wrong creating your account. Please try again.' });
      setSuState('idle');
    }
  }

  async function resendLink() {
    try {
      await resendVerification(sentTo);
      setResendCount((c) => c + 1);
      setResendAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setResendError(null);
    } catch {
      setResendError('We couldn’t send that again just now. Please try in a moment.');
    }
  }

  const Alert = ({ title, body, tone, children }) => (
    <div
      className="rr-rise mb-6 flex gap-3 border p-4"
      role="alert"
      style={{ borderColor: tone === 'accent' ? accent + '55' : line, backgroundColor: tone === 'accent' ? accent + '12' : 'transparent', borderRadius: radius }}
    >
      <span className="mt-0.5 shrink-0" style={{ color: tone === 'accent' ? accent : ink }} aria-hidden="true">
        <IconAlert className="h-[18px] w-[18px]" />
      </span>
      <div>
        <p className="text-[14px] font-semibold" style={{ color: tone === 'accent' ? accent : ink }}>{title}</p>
        <p className="mt-1 text-[14px] leading-6" style={{ color: quiet }}>{body}</p>
        {children}
      </div>
    </div>
  );

  const FieldError = ({ id, children }) =>
    children ? (
      <p id={id} className="mt-2 flex items-start gap-1.5 text-[13px] leading-5" style={{ color: accent }}>
        <span aria-hidden="true" className="mt-[2px]"><IconAlert className="h-[14px] w-[14px]" /></span>
        <span>{children}</span>
      </p>
    ) : null;

  const primaryButtonStyle = {
    backgroundColor: ink,
    color: brand.backgroundColor,
    borderRadius: radius,
  };

  return (
    <div className="min-h-full w-full" style={{ backgroundColor: brand.backgroundColor, fontFamily: brand.fontBody }}>
      <style>{css}</style>

      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-10 sm:py-16 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.02fr_minmax(390px,1fr)] lg:gap-20">

          {/* ——— Narrative column ——— */}
          <section className="order-2 lg:order-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
              Private library · Grounded answers
            </p>
            <h1
              className="mt-5 text-[2.5rem] leading-[1.08] tracking-[-0.02em] sm:text-[3.25rem]"
              style={{ color: ink, fontFamily: brand.fontHeading }}
            >
              Ask your own
              <br />
              documents.
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-[1.75]" style={{ color: quiet }}>
              Sign in to pick up your conversations, or create an account and upload your first file.
              Every answer arrives with the passage it was drawn from.
            </p>

            <figure
              className="mt-10 max-w-md border bg-white p-6 sm:p-7"
              style={{ borderColor: line, borderRadius: radius }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: quiet }}>
                You asked
              </p>
              <p className="mt-2 text-[15px] leading-6" style={{ color: ink }}>{SAMPLE.question}</p>

              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: quiet }}>
                The answer
              </p>
              <p className="mt-2 text-[16px] leading-[1.7]" style={{ color: ink }}>{SAMPLE.answer}</p>

              <blockquote className="mt-5 border-l-2 pl-5" style={{ borderColor: accent }}>
                <p className="text-[14.5px] leading-[1.75]" style={{ color: quiet }}>“{SAMPLE.quote}”</p>
                <figcaption className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: accent }}>
                  <span aria-hidden="true"><IconFile className="h-[14px] w-[14px]" /></span>
                  <span className="font-medium">{SAMPLE.source}</span>
                  <span style={{ color: quiet }}>· {SAMPLE.pageRef}</span>
                </figcaption>
              </blockquote>
            </figure>

            <h2 className="sr-only">What an account gives you</h2>
            <ul className="mt-10 max-w-md space-y-4">
              {PROMISES.map((p) => (
                <li key={p} className="flex gap-3 text-[14.5px] leading-6" style={{ color: quiet }}>
                  <span className="mt-[3px] shrink-0" style={{ color: ink }} aria-hidden="true">
                    <IconCheck className="h-[16px] w-[16px]" />
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ——— Auth column ——— */}
          <section className="order-1 lg:order-2" aria-label="Account access">
            {notice && (
              <div
                className="rr-rise mb-6 flex items-start gap-3 border px-4 py-3.5"
                style={{ borderColor: line, backgroundColor: brand.neutralColor + '0F', borderRadius: radius }}
              >
                <span className="mt-0.5 shrink-0" style={{ color: ink }} aria-hidden="true">
                  <IconFile className="h-[16px] w-[16px]" />
                </span>
                <p className="flex-1 text-[14px] leading-6" style={{ color: quiet }}>
                  You asked for your <span style={{ color: ink }}>document library</span>. Sign in and we’ll take you straight there.
                </p>
                <button
                  type="button"
                  onClick={() => setNotice(false)}
                  aria-label="Dismiss this message"
                  className="rr-focus -mr-1 -mt-1 rounded p-1"
                  style={{ color: quiet }}
                >
                  <IconX className="h-[15px] w-[15px]" aria-hidden="true" />
                </button>
              </div>
            )}

            <Card className="border bg-white shadow-sm" style={{ borderColor: line, borderRadius: radius }}>
              <div className="border-b px-6 pt-2 sm:px-8" style={{ borderColor: line }}>
                <div role="tablist" aria-label="Sign in or create account" className="flex gap-7" onKeyDown={onTabKey}>
                  {[
                    { id: 'signin', label: 'Sign in' },
                    { id: 'signup', label: 'Create account' },
                  ].map((t) => {
                    const active = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        ref={tabRefs[t.id]}
                        id={'tab-' + t.id}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        aria-controls={'panel-' + t.id}
                        tabIndex={active ? 0 : -1}
                        onClick={() => selectTab(t.id)}
                        className="rr-focus -mb-px rounded-t px-0.5 pb-3.5 pt-3 text-[15px] font-medium transition-colors"
                        style={{
                          color: active ? ink : quiet,
                          borderBottom: '2px solid ' + (active ? ink : 'transparent'),
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <CardContent className="px-6 py-8 sm:px-8 sm:py-9">

                {/* ——— SIGN IN ——— */}
                {tab === 'signin' && (
                  <div role="tabpanel" id="panel-signin" aria-labelledby="tab-signin" className="rr-rise">
                    {signinState === 'success' ? (
                      <div className="rr-rise">
                        <span
                          className="inline-flex h-11 w-11 items-center justify-center"
                          style={{ backgroundColor: ink + '14', color: ink, borderRadius: radius }}
                          aria-hidden="true"
                        >
                          <IconCheckCircle className="h-[22px] w-[22px]" />
                        </span>
                        <h2 className="mt-5 text-[22px] tracking-[-0.01em]" style={{ color: ink, fontFamily: brand.fontHeading }}>
                          Signed in as {signinResult?.email}
                        </h2>
                        <p className="mt-3 text-[15px] leading-[1.7]" style={{ color: quiet }}>
                          Your session is held in a secure, HTTP-only cookie{remember ? ' and will be kept on this device' : ' for this browser session only'}.
                          Picking up where you left off.
                        </p>
                        <Button
                          type="button"
                          onClick={() => navigate('chat')}
                          className="rr-focus mt-7 flex w-full items-center justify-center gap-2 px-5 py-3 text-[15px] font-medium"
                          style={primaryButtonStyle}
                        >
                          {signinResult?.most_recent_conversation_id
                            ? 'Open your most recent conversation'
                            : 'Start your first conversation'}
                          <span aria-hidden="true"><IconArrowRight className="h-[16px] w-[16px]" /></span>
                        </Button>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                          <button
                            type="button"
                            onClick={() => navigate('library')}
                            className="rr-focus rr-underline rounded text-[14px] underline underline-offset-4"
                            style={{ color: ink }}
                          >
                            Go to my document library
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('account')}
                            className="rr-focus rr-underline rounded text-[14px] underline underline-offset-4"
                            style={{ color: quiet }}
                          >
                            Account settings
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSignIn} noValidate>
                        <h2 className="text-[22px] tracking-[-0.01em]" style={{ color: ink, fontFamily: brand.fontHeading }}>
                          Welcome back
                        </h2>
                        <p className="mt-2 text-[14.5px] leading-6" style={{ color: quiet }}>
                          Use the email address you verified when you signed up.
                        </p>

                        <div className="mt-7">
                          {signinAlert && (
                            <Alert title={signinAlert.title} body={signinAlert.body} tone="accent" />
                          )}

                          <div>
                            <Label htmlFor="signin-email" className="block text-[13px] font-semibold" style={{ color: ink }}>
                              Email address
                            </Label>
                            <Input
                              id="signin-email"
                              type="email"
                              autoComplete="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              aria-invalid={signinFields.email ? 'true' : undefined}
                              aria-describedby={signinFields.email ? 'signin-email-error' : undefined}
                              className={fieldClass + ' mt-2'}
                              style={{ ...fieldStyle, borderColor: signinFields.email ? accent : line }}
                            />
                            <FieldError id="signin-email-error">{signinFields.email}</FieldError>
                          </div>

                          <div className="mt-5">
                            <div className="flex items-baseline justify-between gap-4">
                              <Label htmlFor="signin-password" className="block text-[13px] font-semibold" style={{ color: ink }}>
                                Password
                              </Label>
                              <button
                                type="button"
                                onClick={() => navigate('reset-password')}
                                className="rr-focus rr-underline rounded text-[13px] underline underline-offset-4"
                                style={{ color: accent }}
                              >
                                Forgotten your password?
                              </button>
                            </div>
                            <div className="relative mt-2">
                              <Input
                                id="signin-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                aria-invalid={signinFields.password ? 'true' : undefined}
                                aria-describedby={signinFields.password ? 'signin-password-error' : undefined}
                                className={fieldClass + ' pr-20'}
                                style={{ ...fieldStyle, borderColor: signinFields.password ? accent : line }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-pressed={showPassword}
                                className="rr-focus absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[12.5px] font-medium"
                                style={{ color: quiet }}
                              >
                                {showPassword ? 'Hide' : 'Show'}
                              </button>
                            </div>
                            <FieldError id="signin-password-error">{signinFields.password}</FieldError>
                          </div>

                          <div className="mt-6 flex items-center gap-2.5">
                            <input
                              id="signin-remember"
                              type="checkbox"
                              checked={remember}
                              onChange={(e) => setRemember(e.target.checked)}
                              className="rr-focus h-[15px] w-[15px]"
                              style={{ accentColor: ink }}
                            />
                            <Label htmlFor="signin-remember" className="text-[14px]" style={{ color: quiet }}>
                              Keep me signed in on this device
                            </Label>
                          </div>

                          <Button
                            type="submit"
                            disabled={signinState === 'submitting'}
                            className="rr-focus mt-7 flex w-full items-center justify-center gap-2 px-5 py-3 text-[15px] font-medium"
                            style={{
                              ...primaryButtonStyle,
                              opacity: signinState === 'submitting' ? 0.55 : 1,
                            }}
                          >
                            {signinState === 'submitting' ? (
                              <>
                                <span className="flex gap-1" aria-hidden="true">
                                  <span className="rr-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brand.backgroundColor }} />
                                  <span className="rr-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brand.backgroundColor }} />
                                  <span className="rr-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brand.backgroundColor }} />
                                </span>
                                Checking your details…
                              </>
                            ) : (
                              'Sign in'
                            )}
                          </Button>

                          <p className="mt-4 text-center text-[13.5px]" style={{ color: quiet }}>
                            No account yet?{' '}
                            <button
                              type="button"
                              onClick={() => { selectTab('signup'); const el = tabRefs.signup.current; if (el) el.focus(); }}
                              className="rr-focus rr-underline rounded font-medium underline underline-offset-4"
                              style={{ color: ink }}
                            >
                              Create one in a minute
                            </button>
                          </p>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* ——— SIGN UP ——— */}
                {tab === 'signup' && (
                  <div role="tabpanel" id="panel-signup" aria-labelledby="tab-signup" className="rr-rise">
                    {suState === 'sent' ? (
                      <div className="rr-rise">
                        <span
                          className="inline-flex h-11 w-11 items-center justify-center"
                          style={{ backgroundColor: accent + '18', color: accent, borderRadius: radius }}
                          aria-hidden="true"
                        >
                          <IconCheckCircle className="h-[22px] w-[22px]" />
                        </span>
                        <h2 className="mt-5 text-[22px] tracking-[-0.01em]" style={{ color: ink, fontFamily: brand.fontHeading }}>
                          Check your inbox
                        </h2>
                        <p className="mt-3 text-[15px] leading-[1.7]" style={{ color: quiet }}>
                          If <span style={{ color: ink }}>{sentTo}</span> can be used, a verification link is on its way. It expires
                          in <span style={{ fontVariantNumeric: 'tabular-nums' }}>24</span> hours. Uploads and questions open up once the address is confirmed.
                        </p>

                        <div
                          className="mt-6 flex items-start gap-3 border px-4 py-3.5"
                          style={{ borderColor: line, backgroundColor: brand.neutralColor + '0F', borderRadius: radius }}
                        >
                          <span className="mt-0.5 shrink-0" style={{ color: quiet }} aria-hidden="true">
                            <IconUpload className="h-[16px] w-[16px]" />
                          </span>
                          <p className="text-[13.5px] leading-6" style={{ color: quiet }}>
                            Free tier: <span style={{ fontVariantNumeric: 'tabular-nums' }}>20</span> documents,{' '}
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>200 MB</span> of storage and{' '}
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>300</span> questions a month.
                          </p>
                        </div>

                        <Button
                          type="button"
                          onClick={() => navigate('verify-email')}
                          className="rr-focus mt-7 flex w-full items-center justify-center gap-2 px-5 py-3 text-[15px] font-medium"
                          style={primaryButtonStyle}
                        >
                          I’ve opened the link
                          <span aria-hidden="true"><IconArrowRight className="h-[16px] w-[16px]" /></span>
                        </Button>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={resendLink}
                            className="rr-focus rr-underline rounded text-[13.5px] underline underline-offset-4"
                            style={{ color: ink }}
                          >
                            Send the link again
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSuState('idle'); setTurnstileToken(''); setTurnstileKey((k) => k + 1); }}
                            className="rr-focus rr-underline inline-flex items-center gap-1.5 rounded text-[13.5px] underline underline-offset-4"
                            style={{ color: quiet }}
                          >
                            <span aria-hidden="true"><IconArrowLeft className="h-[14px] w-[14px]" /></span>
                            Use a different address
                          </button>
                        </div>

                        {resendCount > 0 && (
                          <p className="rr-rise mt-4 text-[13px]" role="status" style={{ color: accent, fontVariantNumeric: 'tabular-nums' }}>
                            Sent again at {resendAt}{resendCount > 1 ? ` · ${resendCount} resends this hour` : ''}.
                          </p>
                        )}
                        {resendError && (
                          <p className="rr-rise mt-4 text-[13px]" role="alert" style={{ color: accent }}>
                            {resendError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleSignUp} noValidate>
                        <h2 className="text-[22px] tracking-[-0.01em]" style={{ color: ink, fontFamily: brand.fontHeading }}>
                          Create your account
                        </h2>
                        <p className="mt-2 text-[14.5px] leading-6" style={{ color: quiet }}>
                          One person, one private library. Nothing you upload is shared or used for training.
                        </p>

                        <div className="mt-7">
                          {suFields.form && (
                            <Alert title="Something went wrong" body={suFields.form} tone="accent" />
                          )}

                          <Label htmlFor="signup-email" className="block text-[13px] font-semibold" style={{ color: ink }}>
                            Email address
                          </Label>
                          <Input
                            id="signup-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={suEmail}
                            onChange={(e) => setSuEmail(e.target.value)}
                            aria-invalid={suFields.email ? 'true' : undefined}
                            aria-describedby={suFields.email ? 'signup-email-error' : undefined}
                            className={fieldClass + ' mt-2'}
                            style={{ ...fieldStyle, borderColor: suFields.email ? accent : line }}
                          />
                          <FieldError id="signup-email-error">{suFields.email}</FieldError>
                        </div>

                        <div className="mt-5">
                          <Label htmlFor="signup-password" className="block text-[13px] font-semibold" style={{ color: ink }}>
                            Password
                          </Label>
                          <Input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={suPassword}
                            onChange={(e) => setSuPassword(e.target.value)}
                            aria-invalid={suFields.password ? 'true' : undefined}
                            aria-describedby="signup-password-rules"
                            className={fieldClass + ' mt-2'}
                            style={{ ...fieldStyle, borderColor: suFields.password ? accent : line }}
                          />
                          <ul id="signup-password-rules" className="mt-3 space-y-1.5">
                            {PASSWORD_RULES.map((rule) => {
                              const met = rule.test(suPassword);
                              return (
                                <li key={rule.id} className="flex items-center gap-2 text-[13px]" style={{ color: met ? ink : quiet }}>
                                  <span aria-hidden="true" style={{ color: met ? ink : quiet, opacity: met ? 1 : 0.5 }}>
                                    {met ? <IconCheck className="h-[14px] w-[14px]" /> : <IconX className="h-[14px] w-[14px]" />}
                                  </span>
                                  <span>{rule.label}</span>
                                  <span className="sr-only">{met ? ' — met' : ' — not yet met'}</span>
                                </li>
                              );
                            })}
                          </ul>
                          <FieldError id="signup-password-error">{suFields.password}</FieldError>
                        </div>

                        <div
                          className="mt-6 border px-4 py-4"
                          style={{ borderColor: suFields.human ? accent : line, backgroundColor: brand.neutralColor + '0A', borderRadius: radius }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <Label className="text-[14px] font-medium" style={{ color: ink }}>
                                Confirm you’re a person
                              </Label>
                              <p className="mt-1 text-[12.5px] leading-5" style={{ color: quiet }}>
                                Bot check · keeps scripted sign-ups off the Gemini quota that pays for your answers.
                              </p>
                            </div>
                            {turnstileToken && (
                              <Badge
                                className="rr-rise shrink-0 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                                style={{ backgroundColor: ink, color: brand.backgroundColor, borderRadius: radius }}
                              >
                                Passed
                              </Badge>
                            )}
                          </div>
                          <div className="mt-3">
                            <Turnstile
                              key={turnstileKey}
                              siteKey={TURNSTILE_SITE_KEY}
                              onSuccess={(token) => {
                                setTurnstileToken(token);
                                setSuFields((f) => ({ ...f, human: undefined }));
                              }}
                              onExpire={() => setTurnstileToken('')}
                              onError={() => setTurnstileToken('')}
                            />
                          </div>
                          <FieldError id="signup-human-error">{suFields.human}</FieldError>
                        </div>

                        <Button
                          type="submit"
                          disabled={suState === 'submitting' || !turnstileToken}
                          className="rr-focus mt-7 flex w-full items-center justify-center gap-2 px-5 py-3 text-[15px] font-medium"
                          style={{ ...primaryButtonStyle, opacity: suState === 'submitting' || !turnstileToken ? 0.55 : 1 }}
                        >
                          {suState === 'submitting' ? (
                            <>
                              <span className="flex gap-1" aria-hidden="true">
                                <span className="rr-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brand.backgroundColor }} />
                                <span className="rr-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brand.backgroundColor }} />
                                <span className="rr-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brand.backgroundColor }} />
                              </span>
                              Creating your library…
                            </>
                          ) : (
                            'Create account and send verification link'
                          )}
                        </Button>

                        <p className="mt-4 text-center text-[13.5px]" style={{ color: quiet }}>
                          Already have a library?{' '}
                          <button
                            type="button"
                            onClick={() => { selectTab('signin'); const el = tabRefs.signin.current; if (el) el.focus(); }}
                            className="rr-focus rr-underline rounded font-medium underline underline-offset-4"
                            style={{ color: ink }}
                          >
                            Sign in
                          </button>
                        </p>
                      </form>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="mt-6 flex items-start gap-2 px-1 text-[12.5px] leading-5" style={{ color: quiet }}>
              <span className="mt-[2px] shrink-0" aria-hidden="true"><IconUser className="h-[14px] w-[14px]" /></span>
              <span>
                Sessions are held in a secure, HTTP-only cookie. Signing out on a shared device ends the session immediately.
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
