"""Auth and session endpoints: signup, email verification, login/logout and
the forgotten-password reset flow (`RAGCD78C25-10-1`).
"""

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Conversation, EmailToken, User
from app.schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    ResendRequest,
    ResendResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    SignupRequest,
    SignupResponse,
    VerifyRequest,
    VerifyResponse,
)
from app.security import (
    SESSION_COOKIE_NAME,
    check_and_increment_rate_limit,
    clear_session_cookie,
    generate_raw_token,
    hash_password,
    hash_token,
    revoke_session_token,
    send_password_reset_email,
    send_verification_email,
    set_session_cookie,
    verify_password_timing_safe,
    verify_turnstile,
)

router = APIRouter(prefix="/auth", tags=["auth"])

VERIFY_TOKEN_TTL_HOURS = 24
RESET_TOKEN_TTL_HOURS = 1

DbSession = Annotated[Session, Depends(get_db)]


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


def _invalid_reset_token_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": "reset_link_invalid",
            "message": "This password reset link is no longer valid or has already been used.",
        },
    )


def _invalid_credentials_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "invalid_credentials",
            "message": "Email or password is incorrect.",
        },
    )


def _issue_verification_token(db: Session, user: User) -> str:
    raw_token = generate_raw_token()
    token = EmailToken(
        user_id=user.id,
        purpose="verify_email",
        token_hash=hash_token(raw_token),
        expires_at=datetime.now(UTC) + timedelta(hours=VERIFY_TOKEN_TTL_HOURS),
    )
    db.add(token)
    db.commit()
    return raw_token


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, request: Request, db: DbSession) -> SignupResponse:
    ip = _client_ip(request)

    if not check_and_increment_rate_limit(f"signup_rl:{ip}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "rate_limited",
                "message": "Too many signup attempts. Try again later.",
            },
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
    payload: VerifyRequest, response: Response, db: DbSession
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
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at < datetime.now(UTC):
        raise _invalid_token_error()

    user = db.query(User).filter(User.id == record.user_id).first()
    if user is None:
        raise _invalid_token_error()

    record.used_at = datetime.now(UTC)
    user.email_verified = True
    db.commit()

    set_session_cookie(response, str(user.id))

    return VerifyResponse()


@router.post("/verify/resend", response_model=ResendResponse)
async def resend_verification(payload: ResendRequest, db: DbSession) -> ResendResponse:
    user = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()
    if user is not None and not user.email_verified:
        raw_token = _issue_verification_token(db, user)
        send_verification_email(user.email, raw_token)

    return ResendResponse()


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, response: Response, db: DbSession) -> LoginResponse:
    user = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()

    # Hash against a dummy value when there is no account at all, so an
    # unknown address takes the same code path (and roughly the same time)
    # as a known one with a wrong password.
    password_ok = verify_password_timing_safe(
        payload.password, user.password_hash if user is not None else None
    )
    if user is None or not password_ok:
        raise _invalid_credentials_error()

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "verification_required",
                "message": "Please verify your email before signing in.",
            },
        )

    set_session_cookie(response, str(user.id))

    conversation = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .first()
    )
    return LoginResponse(conversation_id=str(conversation.id) if conversation is not None else None)


@router.post("/logout", response_model=LogoutResponse)
async def logout(request: Request, response: Response) -> LogoutResponse:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        revoke_session_token(token)
    clear_session_cookie(response)
    return LogoutResponse()


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    payload: ForgotPasswordRequest, db: DbSession
) -> ForgotPasswordResponse:
    user = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()
    if user is not None:
        raw_token = generate_raw_token()
        token = EmailToken(
            user_id=user.id,
            purpose="reset_password",
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(UTC) + timedelta(hours=RESET_TOKEN_TTL_HOURS),
        )
        db.add(token)
        db.commit()
        send_password_reset_email(user.email, raw_token)

    return ForgotPasswordResponse()


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(payload: ResetPasswordRequest, db: DbSession) -> ResetPasswordResponse:
    token_hash = hash_token(payload.token)
    record = (
        db.query(EmailToken)
        .filter(EmailToken.token_hash == token_hash, EmailToken.purpose == "reset_password")
        .first()
    )
    if record is None or record.used_at is not None:
        raise _invalid_reset_token_error()

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at < datetime.now(UTC):
        raise _invalid_reset_token_error()

    user = db.query(User).filter(User.id == record.user_id).first()
    if user is None:
        raise _invalid_reset_token_error()

    user.password_hash = hash_password(payload.password)
    record.used_at = datetime.now(UTC)
    db.commit()

    return ResetPasswordResponse()
