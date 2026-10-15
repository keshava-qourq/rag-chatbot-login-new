"""Pydantic request and response models.

One pair per entity in the approved data model, plus the placeholder every
generated route returns until it has been implemented.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator


class StubResponse(BaseModel):
    """What a generated route returns until someone implements it.

    A stub that returns a typed body rather than raising keeps the service
    startable and its OpenAPI document complete, so the frontend can be built
    against the agreed shape while the handlers are still being written.
    """

    endpoint: str
    status: str = "not_implemented"
    detail: str = "Scaffolded from the approved API spec; no behaviour yet."


def _check_password_strength(value: str) -> str:
    if (
        len(value) < 10
        or not any(c.isalpha() for c in value)
        or not any(c.isdigit() for c in value)
    ):
        raise ValueError(
            "Password must be at least 10 characters and include a letter and a number."
        )
    return value


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    turnstile_token: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return _check_password_strength(value)


class SignupResponse(BaseModel):
    """Neutral by design: identical whether the email was new or already
    registered, so the response itself cannot be used to enumerate accounts."""

    message: str = "If this email can be registered, a verification email has been sent."
    verification_required: bool = True


class VerifyRequest(BaseModel):
    token: str


class LibraryState(BaseModel):
    documents: list = Field(default_factory=list)


class VerifyResponse(BaseModel):
    verified: bool = True
    library: LibraryState = Field(default_factory=LibraryState)


class ResendRequest(BaseModel):
    email: EmailStr


class ResendResponse(BaseModel):
    message: str = (
        "If this email is registered and unverified, a new verification email has been sent."
    )


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """The id of the user's most recent conversation, or null when they have
    none yet -- the client uses this to decide whether to land on an empty
    chat screen or resume the last one."""

    conversation_id: str | None = None


class LogoutResponse(BaseModel):
    message: str = "You have been signed out."


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Neutral by design: identical whether the email is registered or not,
    so the response itself cannot be used to enumerate accounts."""

    message: str = "If this email is registered, a password reset link has been sent."


class ResetPasswordRequest(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return _check_password_strength(value)


class ResetPasswordResponse(BaseModel):
    message: str = "Your password has been updated."
