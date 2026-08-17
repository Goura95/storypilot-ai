from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.security import (
    get_current_user,
    get_current_session_id,
)

from app.services.session_service import (
    get_active_sessions,
    revoke_session,
    revoke_all_other_sessions,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/auth/sessions",
    tags=["Active Sessions"],
)


# ============================================================
# GET ACTIVE SESSIONS
# ============================================================

@router.get("")
def get_sessions(
    user_id: int = Depends(get_current_user),
    current_session_id: str = Depends(
        get_current_session_id
    ),
    db: Session = Depends(get_db),
):
    return get_active_sessions(
        user_id=user_id,
        current_session_id=current_session_id,
        db=db,
    )


# ============================================================
# REVOKE ONE SESSION
# ============================================================

@router.delete("/{session_id}")
def delete_session(
    session_id: str,
    user_id: int = Depends(get_current_user),
    current_session_id: str = Depends(
        get_current_session_id
    ),
    db: Session = Depends(get_db),
):
    return revoke_session(
        user_id=user_id,
        session_id=session_id,
        current_session_id=current_session_id,
        db=db,
    )


# ============================================================
# REVOKE ALL OTHER SESSIONS
# ============================================================

@router.post("/revoke-all")
def delete_all_other_sessions(
    user_id: int = Depends(get_current_user),
    current_session_id: str = Depends(
        get_current_session_id
    ),
    db: Session = Depends(get_db),
):
    return revoke_all_other_sessions(
        user_id=user_id,
        current_session_id=current_session_id,
        db=db,
    )