"""Tests for POST /auth/signup, /auth/verify and /auth/verify/resend."""

import time

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.routers.auth as auth_router
import app.security as security
from app.database import Base, get_db
from app.main import app
from app.models import User

VALID_PASSWORD = "Password123"


@pytest.fixture()
def db_override():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    return TestingSessionLocal, override_get_db


@pytest.fixture()
def session_factory(db_override):
    factory, _ = db_override
    return factory


@pytest.fixture()
def client(db_override):
    _, override_get_db = db_override
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _reset_rate_limit():
    security.reset_rate_limit_state()
    yield
    security.reset_rate_limit_state()


@pytest.fixture(autouse=True)
def _turnstile_stub(monkeypatch):
    async def _stub(token, remote_ip=None):
        return token != "deny"

    monkeypatch.setattr(auth_router, "verify_turnstile", _stub)


def _signup_payload(email: str, token: str = "tok", password: str = VALID_PASSWORD) -> dict:
    return {"email": email, "password": password, "turnstile_token": token}


def test_signup_creates_unverified_account_and_sends_email(client, session_factory, monkeypatch):
    sent = []
    monkeypatch.setattr(
        auth_router, "send_verification_email", lambda email, token: sent.append((email, token))
    )

    resp = client.post("/auth/signup", json=_signup_payload("new@example.com"))

    assert resp.status_code == 201
    body = resp.json()
    assert body["verification_required"] is True

    db = session_factory()
    user = db.query(User).filter(User.email == "new@example.com").first()
    assert user is not None
    assert user.email_verified is False
    db.close()

    assert len(sent) == 1
    assert sent[0][0] == "new@example.com"


def test_signup_with_existing_email_is_neutral_and_creates_no_second_account(
    client, session_factory, monkeypatch
):
    sent = []
    monkeypatch.setattr(
        auth_router, "send_verification_email", lambda email, token: sent.append((email, token))
    )

    first = client.post("/auth/signup", json=_signup_payload("dup@example.com"))
    second = client.post("/auth/signup", json=_signup_payload("dup@example.com"))

    assert first.status_code == second.status_code == 201
    assert first.json() == second.json()

    db = session_factory()
    count = db.query(User).filter(User.email == "dup@example.com").count()
    db.close()
    assert count == 1
    assert len(sent) == 1


def test_signup_rejects_invalid_email_and_weak_password(client, session_factory):
    resp = client.post(
        "/auth/signup", json=_signup_payload("not-an-email", password="short1")
    )

    assert resp.status_code == 422
    errors = resp.json()["detail"]
    fields = {tuple(e["loc"])[-1] for e in errors}
    assert "email" in fields
    assert "password" in fields

    db = session_factory()
    assert db.query(User).count() == 0
    db.close()


def test_signup_rejects_without_valid_turnstile_token(client, session_factory):
    resp = client.post("/auth/signup", json=_signup_payload("blocked@example.com", token="deny"))

    assert resp.status_code == 400
    assert resp.json()["detail"]["code"] == "turnstile_failed"

    db = session_factory()
    assert db.query(User).filter(User.email == "blocked@example.com").count() == 0
    db.close()


def test_signup_rate_limited_per_ip_and_resets_after_window(client, monkeypatch):
    monkeypatch.setenv("SIGNUP_RATE_LIMIT_MAX", "2")
    monkeypatch.setenv("SIGNUP_RATE_LIMIT_WINDOW_SECONDS", "1")
    monkeypatch.delenv("REDIS_URL", raising=False)

    r1 = client.post("/auth/signup", json=_signup_payload("rl1@example.com"))
    r2 = client.post("/auth/signup", json=_signup_payload("rl2@example.com"))
    r3 = client.post("/auth/signup", json=_signup_payload("rl3@example.com"))

    assert r1.status_code == 201
    assert r2.status_code == 201
    assert r3.status_code == 429
    assert r3.json()["detail"]["code"] == "rate_limited"

    time.sleep(1.2)

    r4 = client.post("/auth/signup", json=_signup_payload("rl4@example.com"))
    assert r4.status_code == 201


def test_verify_valid_token_marks_verified_sets_cookie_and_returns_library(
    client, monkeypatch
):
    captured = {}
    monkeypatch.setattr(
        auth_router,
        "send_verification_email",
        lambda email, token: captured.update(email=email, token=token),
    )

    signup_resp = client.post("/auth/signup", json=_signup_payload("verify-me@example.com"))
    assert signup_resp.status_code == 201

    verify_resp = client.post("/auth/verify", json={"token": captured["token"]})

    assert verify_resp.status_code == 200
    body = verify_resp.json()
    assert body["verified"] is True
    assert body["library"]["documents"] == []

    set_cookie = verify_resp.headers.get("set-cookie", "")
    assert "session=" in set_cookie
    assert "httponly" in set_cookie.lower()


def test_verify_rejects_used_or_unknown_token(client, monkeypatch):
    captured = {}
    monkeypatch.setattr(
        auth_router,
        "send_verification_email",
        lambda email, token: captured.update(email=email, token=token),
    )

    client.post("/auth/signup", json=_signup_payload("onetime@example.com"))
    token = captured["token"]

    first = client.post("/auth/verify", json={"token": token})
    assert first.status_code == 200

    second = client.post("/auth/verify", json={"token": token})
    assert second.status_code == 400
    assert second.json()["detail"]["code"] == "verification_link_invalid"

    unknown = client.post("/auth/verify", json={"token": "not-a-real-token"})
    assert unknown.status_code == 400
    assert unknown.json()["detail"]["code"] == "verification_link_invalid"


def test_resend_sends_for_unverified_and_is_neutral_for_unknown(client, monkeypatch):
    sent = []
    monkeypatch.setattr(
        auth_router, "send_verification_email", lambda email, token: sent.append((email, token))
    )

    client.post("/auth/signup", json=_signup_payload("resend-me@example.com"))
    sent.clear()

    known = client.post("/auth/verify/resend", json={"email": "resend-me@example.com"})
    assert known.status_code == 200
    assert len(sent) == 1

    unknown = client.post("/auth/verify/resend", json={"email": "ghost@example.com"})
    assert unknown.status_code == 200
    assert unknown.json() == known.json()
    assert len(sent) == 1


def test_require_verified_user_blocks_unauthenticated_and_unverified(db_override):
    session_factory, override_get_db = db_override

    probe_app = FastAPI()
    probe_app.dependency_overrides[get_db] = override_get_db

    @probe_app.get("/protected")
    def protected(user: User = Depends(security.require_verified_user)) -> dict:
        return {"ok": True}

    probe_client = TestClient(probe_app)

    unauthenticated = probe_client.get("/protected")
    assert unauthenticated.status_code == 401
    assert unauthenticated.json()["detail"]["code"] == "not_authenticated"

    db = session_factory()
    user = User(email="unverified@example.com", password_hash="x", email_verified=False)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = security.create_session_token(str(user.id))
    db.close()

    probe_client.cookies.set(security.SESSION_COOKIE_NAME, token)
    forbidden = probe_client.get("/protected")
    assert forbidden.status_code == 403
    assert forbidden.json()["detail"]["code"] == "email_not_verified"


def test_openapi_lists_the_auth_routes(client):
    paths = client.get("/openapi.json").json()["paths"]
    assert "/auth/signup" in paths
    assert "/auth/verify" in paths
    assert "/auth/verify/resend" in paths
