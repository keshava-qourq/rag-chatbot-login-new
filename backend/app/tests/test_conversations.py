"""Tests for POST/GET /conversations, GET /conversations/{id} and the
title-derivation service used when a conversation's first exchange completes.

NOTE: `backend/pytest.ini` sets `testpaths = tests`, so this module (kept
inside `backend/app/` because that is the only path this ticket may write
under) is not auto-collected by a plain `pytest` run from `backend/`. It
should be copied into/merged with `backend/tests/test_conversations.py` by
whoever owns that path, or `testpaths` adjusted, so it actually runs.
"""

import time
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.security as security
from app.database import Base, get_db
from app.main import app
from app.models import Conversation, User
from app.services import (
    DEFAULT_CONVERSATION_TITLE,
    apply_first_exchange_title,
    derive_conversation_title,
)


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


def _make_verified_user(session_factory, email: str) -> tuple[uuid.UUID, str]:
    db = session_factory()
    user = User(email=email, password_hash="x", email_verified=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    user_id = user.id
    db.close()
    token = security.create_session_token(str(user_id))
    return user_id, token


def _authed_client(client: TestClient, token: str) -> TestClient:
    client.cookies.set(security.SESSION_COOKIE_NAME, token)
    return client


# -- POST /conversations -------------------------------------------------


def test_create_conversation_is_empty_and_owned_by_session_user(client, session_factory):
    _, token = _make_verified_user(session_factory, "owner@example.com")
    _authed_client(client, token)

    resp = client.post("/conversations")

    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == DEFAULT_CONVERSATION_TITLE
    assert "id" in body and "created_at" in body and "updated_at" in body


def test_create_conversation_carries_no_context_from_an_earlier_conversation(
    client, session_factory
):
    _, token = _make_verified_user(session_factory, "two-convos@example.com")
    _authed_client(client, token)

    first = client.post("/conversations").json()
    db = session_factory()
    convo = db.query(Conversation).filter(Conversation.id == uuid.UUID(first["id"])).first()
    convo.title = "Earlier topic"
    db.commit()
    db.close()

    second = client.post("/conversations").json()

    assert second["id"] != first["id"]
    assert second["title"] == DEFAULT_CONVERSATION_TITLE


def test_create_conversation_requires_authentication(client):
    resp = client.post("/conversations")
    assert resp.status_code == 401


# -- derive_conversation_title --------------------------------------------


def test_derive_conversation_title_trims_and_collapses_whitespace():
    assert derive_conversation_title("  what   is\n\nthe   refund policy?  ") == (
        "what is the refund policy?"
    )


def test_derive_conversation_title_truncates_long_question_with_ellipsis():
    question = "a" * 80
    title = derive_conversation_title(question, max_length=20)
    assert title == ("a" * 20) + "…"
    assert len(title) == 21


def test_derive_conversation_title_falls_back_to_default_when_empty():
    assert derive_conversation_title("") == DEFAULT_CONVERSATION_TITLE
    assert derive_conversation_title("   \n  ") == DEFAULT_CONVERSATION_TITLE
    assert derive_conversation_title(None) == DEFAULT_CONVERSATION_TITLE


# -- apply_first_exchange_title / sort order -------------------------------


def test_first_exchange_sets_title_and_bumps_updated_at_for_sort_order(
    client, session_factory
):
    _, token = _make_verified_user(session_factory, "exchange@example.com")
    _authed_client(client, token)

    older = client.post("/conversations").json()
    time.sleep(0.01)
    newer = client.post("/conversations").json()

    db = session_factory()
    older_convo = db.query(Conversation).filter(Conversation.id == uuid.UUID(older["id"])).first()
    apply_first_exchange_title(db, older_convo, "  What   is the refund policy?  ")
    db.close()

    listing = client.get("/conversations").json()["conversations"]
    ids_in_order = [c["id"] for c in listing]

    assert ids_in_order[0] == older["id"]
    retitled = next(c for c in listing if c["id"] == older["id"])
    assert retitled["title"] == "What is the refund policy?"
    untouched = next(c for c in listing if c["id"] == newer["id"])
    assert untouched["title"] == DEFAULT_CONVERSATION_TITLE


def test_conversation_with_existing_title_is_never_retitled(client, session_factory):
    _, token = _make_verified_user(session_factory, "retitle@example.com")
    _authed_client(client, token)

    created = client.post("/conversations").json()

    db = session_factory()
    convo = db.query(Conversation).filter(Conversation.id == uuid.UUID(created["id"])).first()
    apply_first_exchange_title(db, convo, "First question")
    assert convo.title == "First question"

    apply_first_exchange_title(db, convo, "A completely different second question")
    db.refresh(convo)
    db.close()

    assert convo.title == "First question"


def test_apply_first_exchange_title_falls_back_to_default_for_empty_question(
    client, session_factory
):
    _, token = _make_verified_user(session_factory, "empty-q@example.com")
    _authed_client(client, token)

    created = client.post("/conversations").json()

    db = session_factory()
    convo = db.query(Conversation).filter(Conversation.id == uuid.UUID(created["id"])).first()
    apply_first_exchange_title(db, convo, "   ")
    db.close()

    assert convo.title == DEFAULT_CONVERSATION_TITLE


# -- GET /conversations and GET /conversations/{id} ------------------------


def test_list_conversations_scoped_to_session_user_newest_first(client, session_factory):
    _, token1 = _make_verified_user(session_factory, "user1@example.com")
    _, token2 = _make_verified_user(session_factory, "user2@example.com")

    _authed_client(client, token1)
    c1 = client.post("/conversations").json()
    time.sleep(0.01)
    c2 = client.post("/conversations").json()

    _authed_client(client, token2)
    other = client.post("/conversations").json()

    _authed_client(client, token1)
    listing = client.get("/conversations").json()["conversations"]
    ids = [c["id"] for c in listing]

    assert ids == [c2["id"], c1["id"]]
    assert other["id"] not in ids


def test_get_conversation_by_id_scoped_to_owner(client, session_factory):
    _, token1 = _make_verified_user(session_factory, "owner2@example.com")
    _, token2 = _make_verified_user(session_factory, "stranger@example.com")

    _authed_client(client, token1)
    created = client.post("/conversations").json()

    resp = client.get(f"/conversations/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]

    _authed_client(client, token2)
    forbidden = client.get(f"/conversations/{created['id']}")
    assert forbidden.status_code == 404
    assert forbidden.json()["detail"]["code"] == "conversation_not_found"


def test_get_conversation_unknown_and_malformed_id_returns_404(client, session_factory):
    _, token = _make_verified_user(session_factory, "lookup@example.com")
    _authed_client(client, token)

    not_found = client.get(f"/conversations/{uuid.uuid4()}")
    assert not_found.status_code == 404

    malformed = client.get("/conversations/not-a-uuid")
    assert malformed.status_code == 404
