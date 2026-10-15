"""Generated routers: one per architecture component that owns endpoints.

Each module here (`auth`, `account`, `documents`, `conversations`) exports a
bare `APIRouter`, already mounted by `app.main`, so the development sprint
adds the endpoints the approved API spec lists into an existing router
instead of wiring a new one into `main.py` for every ticket. No routes are
defined yet -- that is feature work, one ticket at a time.
"""
