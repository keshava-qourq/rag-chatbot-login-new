"""The backing services this application is configured to reach.

Each entry maps an architecture component to the environment variable that
turns it on. `REDIS_URL` ships with docker-compose.yml through .env.example;
the rest are the SaaS keys the product owner has not set yet. A feature reads
its own key at the point of use and reports itself disabled when it is empty
rather than failing the whole app at startup -- this dict is what the health
check uses to surface that same state for the deployment as a whole.
"""

import os
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Conversation

SERVICES = {
    "redis": "REDIS_URL",
    "object_store": "S3_BUCKET",
    "gemini": "GEMINI_API_KEY",
    "email": "SENDGRID_API_KEY",
    "turnstile": "TURNSTILE_SECRET_KEY",
    "payments": "STRIPE_SECRET_KEY",
}


def configured_services() -> dict[str, bool]:
    """Each service mapped to whether its connection variable is set."""
    return {name: bool(os.getenv(var)) for name, var in SERVICES.items()}


DEFAULT_TITLE_MAX_LENGTH = 60
DEFAULT_CONVERSATION_TITLE = "New conversation"


def derive_conversation_title(
    question: str | None, max_length: int = DEFAULT_TITLE_MAX_LENGTH
) -> str:
    """Derive a conversation title from the first question in an exchange.

    Whitespace (including newlines) is collapsed to single spaces and
    surrounding whitespace trimmed, then the result is truncated to
    `max_length` characters (with a trailing ellipsis) so a long question
    still fits the sidebar. An empty or whitespace-only question falls back
    to `DEFAULT_CONVERSATION_TITLE` rather than producing a blank title.

    Used both by the conversations list (once a title has been set) and by
    `apply_first_exchange_title`, which persists it when the first
    question/answer exchange of a conversation completes.
    """
    normalized = " ".join((question or "").split())
    if not normalized:
        return DEFAULT_CONVERSATION_TITLE
    if len(normalized) <= max_length:
        return normalized
    truncated = normalized[:max_length].rstrip()
    return f"{truncated}…"


def apply_first_exchange_title(
    db: Session, conversation: Conversation, question: str
) -> Conversation:
    """Persist the derived title when a conversation's first exchange completes.

    A conversation still carrying the default title is considered untitled;
    this sets its title from the first question and bumps `updated_at` on
    the same write so it sorts first in `GET /conversations` immediately
    after its first answer. A conversation that already has a non-default
    title (meaning an earlier exchange already titled it) is left alone --
    a later exchange never retitles it.
    """
    if conversation.title == DEFAULT_CONVERSATION_TITLE:
        conversation.title = derive_conversation_title(question)
        conversation.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(conversation)
    return conversation
