"""Document library endpoints: upload, list and delete (see the approved API
spec for the exact routes this owns).

No handlers yet -- this just gives the development sprint a registered
router to add them to.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/documents", tags=["documents"])
