"""SQLAlchemy models for the approved data model.

One class per entity the architecture's data model names. These are schema
only -- columns and foreign keys -- so every component that needs `User`,
`Document` and friends has one definition to import rather than five
competing ones drifting apart as the sprint's tickets land. No query logic
and no relationships beyond the foreign keys the schema itself declares;
building those belongs to the tickets that actually query these tables.

`Base` is already bound to the engine and `main.py` imports this module
before it creates the schema.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON, TypeDecorator

from app.database import Base

# text-embedding-004, the Gemini embedding model the architecture names for
# document/question embeddings, returns 768-dimensional vectors.
EMBEDDING_DIM = 768


class EmbeddingVector(TypeDecorator):
    """pgvector's `vector(n)` on Postgres; a JSON array everywhere else.

    `app/database.py` defaults to SQLite so the scaffold runs with nothing
    but `pip install`, and SQLite has no vector type. Point `DATABASE_URL`
    at the real Postgres + pgvector instance the architecture names and this
    column becomes a real `vector(768)` with no code change required.
    """

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from pgvector.sqlalchemy import Vector

            return dialect.type_descriptor(Vector(EMBEDDING_DIM))
        return dialect.type_descriptor(JSON())


def _new_uuid() -> uuid.UUID:
    return uuid.uuid4()


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_new_uuid)
    # Case-insensitive lookup (the architecture's `citext`) is an application
    # concern -- compare with `func.lower()` -- rather than a portable column
    # type, so this stores the raw address.
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class EmailToken(Base):
    __tablename__ = "email_tokens"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_new_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    # "verify_email" or "reset_password".
    purpose: Mapped[str] = mapped_column(String(32), nullable=False)
    token_hash: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_new_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String, nullable=False)
    s3_key: Mapped[str] = mapped_column(String, nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # "queued" | "processing" | "ready" | "failed"; the ingestion worker owns
    # the transitions.
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="queued")
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_new_uuid)
    document_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("documents.id"), nullable=False, index=True
    )
    # Denormalized from `document_id` so retrieval can scope a similarity
    # search to "this user's ready documents" with one indexed column.
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    ordinal: Mapped[int] = mapped_column(Integer, nullable=False)
    page_ref: Mapped[str | None] = mapped_column(String(32), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(EmbeddingVector, nullable=True)


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_new_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False, default="New conversation")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_new_uuid)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("conversations.id"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    # "user" | "assistant".
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Citation(Base):
    __tablename__ = "citations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_new_uuid)
    message_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("messages.id"), nullable=False, index=True
    )
    chunk_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("chunks.id"), nullable=False)
    # Denormalized so a citation still renders after its source document is
    # deleted.
    document_name: Mapped[str] = mapped_column(String, nullable=False)
    quoted_passage: Mapped[str] = mapped_column(Text, nullable=False)
    page_ref: Mapped[str | None] = mapped_column(String(32), nullable=True)


class UsageQuota(Base):
    __tablename__ = "usage_quotas"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), primary_key=True)
    document_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    storage_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    messages_this_month: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    month_reset_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


__all__ = [
    "Base",
    "User",
    "EmailToken",
    "Document",
    "Chunk",
    "Conversation",
    "Message",
    "Citation",
    "UsageQuota",
    "EmbeddingVector",
    "EMBEDDING_DIM",
]
