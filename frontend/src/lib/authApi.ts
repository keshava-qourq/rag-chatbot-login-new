/// <reference types="vite/client" />
// The seam this task wires the Signin create-account tab and the VerifyEmail
// screen against. Shapes here follow the documented contract for
// POST /auth/signup, POST /auth/verify and POST /auth/verify/resend; the
// backend router is still a stub, so this is deliberately the single place
// those shapes are declared.
//
// Login, logout, forgot-password, reset-password and the session check added
// for RAGCD78C25-10-2 follow the same pattern: typed request/response shapes
// against the documented contract, with the session check (GET /auth/session)
// added because every protected route needs a way to ask "is anyone signed
// in" -- see the risk note in that task's report.
import { apiFetch, ApiError } from "@/lib/api";

export { ApiError };

/** Cloudflare's always-pass test site key, used when no real key is baked in
 * at build time (local dev, or a preview build before Turnstile is
 * provisioned for this project). */
export const TURNSTILE_SITE_KEY: string =
  (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? "1x00000000000000000000AA";

export type SignupRequest = {
  email: string;
  password: string;
  turnstile_token: string;
};

export type SignupResponse = {
  email: string;
  status: string;
};

export type VerifyRequest = {
  token: string;
};

export type VerifyResponse = {
  email: string;
  status: string;
};

export type ResendRequest = {
  email: string;
};

export type ResendResponse = {
  status: string;
};

export function signup(body: SignupRequest): Promise<SignupResponse> {
  return apiFetch<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function verifyEmail(token: string): Promise<VerifyResponse> {
  const body: VerifyRequest = { token };
  return apiFetch<VerifyResponse>("/auth/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function resendVerification(email: string): Promise<ResendResponse> {
  const body: ResendRequest = { email };
  return apiFetch<ResendResponse>("/auth/verify/resend", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type LoginRequest = {
  email: string;
  password: string;
  remember?: boolean;
};

export type LoginResponse = {
  email: string;
  /** Null when the account has no conversations yet, in which case the
   * caller lands on the empty chat screen instead. */
  most_recent_conversation_id: string | null;
};

export function login(body: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  message: string;
};

/** Always resolves with the same neutral body, whether or not the address
 * has an account -- the backend's job, not something this helper can check
 * client-side, so the UI must render the confirmation on both outcomes. */
export function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const body: ForgotPasswordRequest = { email };
  return apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type ResetPasswordRequest = {
  token: string;
  password: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export function resetPassword(token: string, password: string): Promise<ResetPasswordResponse> {
  const body: ResetPasswordRequest = { token, password };
  return apiFetch<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type SessionResponse = {
  email: string;
};

/** Not part of the four endpoints this task's contract names -- added
 * because a route guard has to ask something to find out whether the
 * session cookie is still good, and the backend's `get_current_user`
 * dependency already answers that with a 401 for any authenticated route.
 * See this task's `risk` note: the backend needs a matching
 * `GET /auth/session` handler for this to resolve to anything but a 404
 * until then. */
export function getSession(): Promise<SessionResponse> {
  return apiFetch<SessionResponse>("/auth/session");
}

export type FieldErrorDetail = {
  loc: Array<string | number>;
  msg: string;
  type?: string;
};

/** Maps a FastAPI-shaped 422 (`{ detail: [{ loc, msg }] }`) onto the field
 * names the signup form already renders errors for -- `email` / `password` --
 * so a server-side rule failure lands in the same place a client-side one
 * would. Anything else returns no fields, and the caller falls back to a
 * generic message. */
export function fieldErrorsFromApiError(err: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!(err instanceof ApiError) || err.status !== 422) return out;
  const detail = (err.body as { detail?: FieldErrorDetail[] } | undefined)?.detail;
  if (!Array.isArray(detail)) return out;
  for (const d of detail) {
    const field = d.loc[d.loc.length - 1];
    if (typeof field === "string") out[field] = d.msg;
  }
  return out;
}
