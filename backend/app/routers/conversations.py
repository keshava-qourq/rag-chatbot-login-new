"""Conversation and chat endpoints: CRUD plus the streaming chat message (see
the approved API spec for the exact routes this owns).

This ticket (`RAGCD78C25-23-1`) implements creating and listing conversations
scoped to the session user. Message streaming, PATCH and DELETE are out of
scope here.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Conversation, User
from app.schemas import ConversationListResponse, ConversationResponse
from app.security import require_verified_user

router = APIRouter(prefix="/conversations", tags=["conversations"])

CurrentUser = Annotated[User, Depends(require_verified_user)]
DbSession = Annotated[Session, Depends(get_db)]


def _not_found_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "conversation_not_found", "message": "Conversation not found."},
    )


def _to_response(conversation: Conversation) -> ConversationResponse:
    return ConversationResponse(
        id=str(conversation.id),
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    user: CurrentUser,
    db: DbSession,
) -> ConversationResponse:
    """Create a brand new, empty conversation owned by the session user.

    Carries no messages or context from any earlier conversation -- it is a
    fresh row with the default title, returned as the new active
    conversation for the client to switch to.
    """
    conversation = Conversation(user_id=user.id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return _to_response(conversation)


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    user: CurrentUser,
    db: DbSession,
) -> ConversationListResponse:
    """The session user's conversations, newest-activity-first."""
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return ConversationListResponse(conversations=[_to_response(c) for c in conversations])


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    user: CurrentUser,
    db: DbSession,
) -> ConversationResponse:
    """A single conversation, scoped to the session user.

    Another user's conversation id (or one that does not exist, or is not
    even a well-formed id) returns 404 rather than 403, so its existence is
    not leaked to a user who does not own it.
    """
    try:
        parsed_id = uuid.UUID(conversation_id)
    except ValueError as exc:
        raise _not_found_error() from exc

    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == parsed_id, Conversation.user_id == user.id)
        .first()
    )
    if conversation is None:
        raise _not_found_error()
    return _to_response(conversation)
