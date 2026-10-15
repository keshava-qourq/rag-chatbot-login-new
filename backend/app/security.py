"""Shared auth primitives: password hashing, the session JWT, single-use
verification tokens, Turnstile verification and the signup rate limiter.

Lives outside `routers/auth.py` because the session cookie this module issues
is also what `RAGCD78C25-10-1` (login/logout/reset) and any future
verified-email dependency need to read, not just the signup/verify handlers
built here.
"""

import hashlib
import os
import secrets
import time
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, Request, Response, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SESSION_COOKIE_NAME = "session"
SESSION_ALGORITHM = "HS256"


def _secret_key() -> str:
    return os.getenv("SESSION_SECRET_KEY", "dev-insecure-secret-change-me")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


# A fixed, precomputed hash verified against on an unknown-email login so the
# branch that would otherwise skip hashing entirely does not make itself
# observable as a timing difference (and, with it, a way to enumerate
# registered addresses).
_DUMMY_PASSWORD_HASH = pwd_context.hash("not-a-real-account-password")


def verify_password_timing_safe(password: str, password_hash: str | None) -> bool:
    return verify_password(password, password_hash or _DUMMY_PASSWORD_HASH)


def create_session_token(user_id: str) -> str:
    ttl = int(os.getenv("SESSION_TTL_SECONDS", "604800"))
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(seconds=ttl),
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(payload, _secret_key(), algorithm=SESSION_ALGORITHM)


def _decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, _secret_key(), algorithms=[SESSION_ALGORITHM])
    except JWTError:
        return None


def decode_session_token(token: str) -> str | None:
    payload = _decode_token(token)
    if payload is None:
        return None
    return payload.get("sub")


def set_session_cookie(response: Response, user_id: str) -> None:
    token = create_session_token(user_id)
    secure = os.getenv("COOKIE_SECURE", "true").lower() != "false"
    samesite = os.getenv("COOKIE_SAMESITE", "lax")
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    secure = os.getenv("COOKIE_SECURE", "true").lower() != "false"
    samesite = os.getenv("COOKIE_SAMESITE", "lax")
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        secure=secure,
        samesite=samesite,
    )


# -- Session revocation -------------------------------------------------
#
# The session cookie is a stateless JWT, so logging out has to be enforced
# server-side by remembering that a specific token (`jti`) must no longer be
# accepted, even though it has not expired yet. Redis-backed, as the
# architecture names, when `REDIS_URL` is reachable; an in-memory set
# otherwise -- the same fallback shape `check_and_increment_rate_limit` uses.

_revoked_jti_memory: dict[str, float] = {}


def revoke_session_token(token: str) -> None:
    """Mark the token presented at logout as no longer acceptable, even
    though its signature is still valid until it expires."""
    payload = _decode_token(token)
    if payload is None:
        return
    jti = payload.get("jti")
    if not jti:
        return
    exp = payload.get("exp")
    default_ttl = int(os.getenv("SESSION_TTL_SECONDS", "604800"))
    ttl = max(int(exp) - int(time.time()), 1) if exp else default_ttl

    redis_url = os.getenv("REDIS_URL", "")
    if redis_url:
        try:
            import redis as redis_lib

            client = redis_lib.Redis.from_url(redis_url, socket_connect_timeout=1)
            client.setex(f"revoked_session:{jti}", ttl, "1")
            return
        except Exception:
            pass  # fall through to the in-memory set

    _revoked_jti_memory[jti] = time.time() + ttl


def _is_revoked(jti: str) -> bool:
    redis_url = os.getenv("REDIS_URL", "")
    if redis_url:
        try:
            import redis as redis_lib

            client = redis_lib.Redis.from_url(redis_url, socket_connect_timeout=1)
            return bool(client.exists(f"revoked_session:{jti}"))
        except Exception:
            pass  # fall through to the in-memory set

    expires_at = _revoked_jti_memory.get(jti)
    if expires_at is None:
        return False
    if time.time() >= expires_at:
        del _revoked_jti_memory[jti]
        return False
    return True


def reset_revoked_session_state() -> None:
    """Test helper: clears the in-memory fallback revocation set."""
    _revoked_jti_memory.clear()


def generate_raw_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


async def verify_turnstile(token: str, remote_ip: str | None = None) -> bool:
    """Verify a Cloudflare Turnstile response token server-side.

    Returns False (rather than raising) on missing configuration or a
    network/HTTP failure, so a signup is rejected rather than silently
    allowed when Turnstile cannot actually be checked.
    """
    secret = os.getenv("TURNSTILE_SECRET_KEY", "")
    if not secret or not token:
        return False
    data = {"secret": secret, "response": token}
    if remote_ip:
        data["remoteip"] = remote_ip
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify", data=data
            )
        resp.raise_for_status()
        return bool(resp.json().get("success"))
    except httpx.HTTPError:
        return False


_rate_limit_memory: dict[str, tuple[int, float]] = {}


def check_and_increment_rate_limit(key: str) -> bool:
    """True if the caller is still under the threshold (and counted), False
    if it should be throttled.

    Redis-backed, as the architecture names, when `REDIS_URL` is reachable;
    an in-memory fixed-window counter otherwise, so this still works against
    the no-dependency scaffold the same way `app/database.py` falls back to
    SQLite.
    """
    limit = int(os.getenv("SIGNUP_RATE_LIMIT_MAX", "5"))
    window = int(os.getenv("SIGNUP_RATE_LIMIT_WINDOW_SECONDS", "3600"))
    redis_url = os.getenv("REDIS_URL", "")
    if redis_url:
        try:
            import redis as redis_lib

            client = redis_lib.Redis.from_url(redis_url, socket_connect_timeout=1)
            count = client.incr(key)
            if count == 1:
                client.expire(key, window)
            return int(count) <= limit
        except Exception:
            pass  # fall through to the in-memory counter

    now = time.time()
    count, reset_at = _rate_limit_memory.get(key, (0, now + window))
    if now >= reset_at:
        count, reset_at = 0, now + window
    count += 1
    _rate_limit_memory[key] = (count, reset_at)
    return count <= limit


def reset_rate_limit_state() -> None:
    """Test helper: clears the in-memory fallback counters between tests."""
    _rate_limit_memory.clear()


def send_verification_email(to_email: str, raw_token: str) -> None:
    """Send the verification link via SendGrid.

    A no-op when `SENDGRID_API_KEY` is unset so signup still completes in a
    local/dev environment that has not wired the real provider up yet --
    matching how `app/services.py` reports every integration as optional.
    """
    api_key = os.getenv("SENDGRID_API_KEY", "")
    base_url = os.getenv("APP_BASE_URL", "http://localhost:5173")
    verify_link = f"{base_url}/verify-email?token={raw_token}"
    if not api_key:
        return

    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail

    message = Mail(
        from_email=os.getenv("EMAIL_FROM", "no-reply@example.com"),
        to_emails=to_email,
        subject="Verify your email",
        plain_text_content=f"Verify your email: {verify_link}",
    )
    SendGridAPIClient(api_key).send(message)


def send_password_reset_email(to_email: str, raw_token: str) -> None:
    """Send the single-use password reset link via SendGrid.

    A no-op when `SENDGRID_API_KEY` is unset, matching
    `send_verification_email`.
    """
    api_key = os.getenv("SENDGRID_API_KEY", "")
    base_url = os.getenv("APP_BASE_URL", "http://localhost:5173")
    reset_link = f"{base_url}/reset-password?token={raw_token}"
    if not api_key:
        return

    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail

    message = Mail(
        from_email=os.getenv("EMAIL_FROM", "no-reply@example.com"),
        to_emails=to_email,
        subject="Reset your password",
        plain_text_content=f"Reset your password: {reset_link}",
    )
    SendGridAPIClient(api_key).send(message)


DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(request: Request, db: DbSession) -> User:
    """Resolve the session cookie into a `User`, or 401.

    Shared by any route that needs "signed in". Rejects a cookie whose
    signature is valid but whose token has been revoked by `/auth/logout`.
    """
    not_authenticated = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "not_authenticated", "message": "Sign in required."},
    )
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise not_authenticated
    payload = _decode_token(token)
    if payload is None:
        raise not_authenticated
    jti = payload.get("jti")
    if jti and _is_revoked(jti):
        raise not_authenticated
    sub = payload.get("sub")
    if not sub:
        raise not_authenticated
    try:
        user_id = uuid.UUID(sub)
    except ValueError as exc:
        raise not_authenticated from exc
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise not_authenticated
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_verified_user(user: CurrentUser) -> User:
    """Gate for document and message actions: 403 with a machine-readable
    code the client maps to a 'verify your email first' prompt."""
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "email_not_verified", "message": "Please verify your email first."},
        )
    return user
