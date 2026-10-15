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
from datetime import datetime, timedelta, timezone

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


def create_session_token(user_id: str) -> str:
    ttl = int(os.getenv("SESSION_TTL_SECONDS", "604800"))
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "iat": now, "exp": now + timedelta(seconds=ttl)}
    return jwt.encode(payload, _secret_key(), algorithm=SESSION_ALGORITHM)


def decode_session_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, _secret_key(), algorithms=[SESSION_ALGORITHM])
    except JWTError:
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


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Resolve the session cookie into a `User`, or 401.

    Shared by any route that needs "signed in" -- `RAGCD78C25-10-1` owns
    login/logout, but the cookie it will issue is this same one.
    """
    not_authenticated = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "not_authenticated", "message": "Sign in required."},
    )
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise not_authenticated
    sub = decode_session_token(token)
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


def require_verified_user(user: User = Depends(get_current_user)) -> User:
    """Gate for document and message actions: 403 with a machine-readable
    code the client maps to a 'verify your email first' prompt."""
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "email_not_verified", "message": "Please verify your email first."},
        )
    return user
