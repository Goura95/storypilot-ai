from datetime import datetime

from pydantic import BaseModel


# ============================================================
# SESSION RESPONSE
# ============================================================

class SessionResponse(BaseModel):
    id: int
    session_id: str
    device: str
    browser: str
    operating_system: str
    ip_address: str | None
    created_at: datetime
    last_active_at: datetime
    expires_at: datetime
    is_current: bool


# ============================================================
# ACTIVE SESSIONS RESPONSE
# ============================================================

class ActiveSessionsResponse(BaseModel):
    success: bool
    message: str
    sessions: list[SessionResponse]


# ============================================================
# SESSION ACTION RESPONSE
# ============================================================

class SessionActionResponse(BaseModel):
    success: bool
    message: str