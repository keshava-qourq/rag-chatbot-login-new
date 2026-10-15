"""The backing services this application is configured to reach.

Each entry maps an architecture component to the environment variable that
turns it on. `REDIS_URL` ships with docker-compose.yml through .env.example;
the rest are the SaaS keys the product owner has not set yet. A feature reads
its own key at the point of use and reports itself disabled when it is empty
rather than failing the whole app at startup -- this dict is what the health
check uses to surface that same state for the deployment as a whole.
"""

import os

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


def derive_conversation_title(question: str, max_length: int = DEFAULT_TITLE_MAX_LENGTH) -> str:
    """Derive a conversation title from the first question in an exchange.

    Whitespace (including newlines) is collapsed to single spaces, then the
    result is truncated to `max_length` characters so a long question still
    fits the sidebar. Used both by the conversations list (once a title has
    been set) and, in future, by the messages endpoint that completes the
    first question/answer exchange and persists it.
    """
    normalized = " ".join(question.split())
    if len(normalized) <= max_length:
        return normalized
    truncated = normalized[:max_length].rstrip()
    return f"{truncated}…"
