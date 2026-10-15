/// <reference types="vite/client" />
// The seam this task wires the Signin create-account tab and the VerifyEmail
// screen against. Shapes here follow the documented contract for
// POST /auth/signup, POST /auth/verify and POST /auth/verify/resend; the
// backend router is still a stub, so this is deliberately the single place
// those shapes are declared.
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
