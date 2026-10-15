"""Auth and session endpoints owned here: signup and email verification.

Login/logout and password reset belong to `RAGCD78C25-10-1` and are not
implemented in this router.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EmailToken, User
from app.schemas import (
    ResendRequest,
    ResendResponse,
    SignupRequest,
    SignupResponse,
    VerifyRequest,
    VerifyResponse,
)
from app.security import (
    check_and_increment_rate_limit,
    generate_raw_token,
    hash_password,
    hash_token,
    send_verification_email,
    set_session_cookie,
    verify_turnstile,
)

router = APIRouter(prefix="/auth", tags=["auth"])

VERIFY_TOKEN_TTL_HOURS = 24


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _invalid_token_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": "verification_link_invalid",
            "message": "This verification link is no longer valid.",
        },
    )


def _issue_verification_token(db: Session, user: User) -> str:
    raw_token = generate_raw_token()
    token = EmailToken(
        user_id=user.id,
        purpose="verify_email",
        token_hash=hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=VERIFY_TOKEN_TTL_HOURS),
    )
    db.add(token)
    db.commit()
    return raw_token


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignupRequest, request: Request, db: Session = Depends(get_db)
) -> SignupResponse:
    ip = _client_ip(request)

    if not check_and_increment_rate_limit(f"signup_rl:{ip}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "rate_limited", "message": "Too many signup attempts. Try again later."},
        )

    if not await verify_turnstile(payload.turnstile_token, ip):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "turnstile_failed", "message": "Bot verification failed."},
        )

    existing = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()
    if existing is None:
        user = User(
            email=payload.email,
            password_hash=hash_password(payload.password),
            email_verified=False,
        )
        db.add(user)
        db.flush()

        raw_token = _issue_verification_token(db, user)
        send_verification_email(user.email, raw_token)

    return SignupResponse()


@router.post("/verify", response_model=VerifyResponse)
async def verify_email(
    payload: VerifyRequest, response: Response, db: Session = Depends(get_db)
) -> VerifyResponse:
    token_hash = hash_token(payload.token)
    record = (
        db.query(EmailToken)
        .filter(EmailToken.token_hash == token_hash, EmailToken.purpose == "verify_email")
        .first()
    )
    if record is None or record.used_at is not None:
        raise _invalid_token_error()

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise _invalid_token_error()

    user = db.query(User).filter(User.id == record.user_id).first()
    if user is None:
        raise _invalid_token_error()

    record.used_at = datetime.now(timezone.utc)
    user.email_verified = True
    db.commit()

    set_session_cookie(response, str(user.id))

    return VerifyResponse()


@router.post("/verify/resend", response_model=ResendResponse)
async def resend_verification(payload: ResendRequest, db: Session = Depends(get_db)) -> ResendResponse:
    user = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()
    if user is not None and not user.email_verified:
        raw_token = _issue_verification_token(db, user)
        send_verification_email(user.email, raw_token)

    return ResendResponse()
