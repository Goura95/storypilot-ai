from datetime import datetime, timedelta
import uuid

from sqlalchemy.orm import Session

from app.models.session import UserSession


# ============================================================
# SESSION EXPIRY
# ============================================================

SESSION_EXPIRE_MINUTES = 60


# ============================================================
# CREATE SESSION
# ============================================================

def create_session(
    user_id: int,
    db: Session,
    device: str,
    browser: str,
    operating_system: str,
    ip_address: str | None,
    user_agent: str | None,
):
    now = datetime.utcnow()

    expires_at = (
        now
        + timedelta(
            minutes=SESSION_EXPIRE_MINUTES
        )
    )

    session_id = str(uuid.uuid4())

    new_session = UserSession(
        session_id=session_id,
        user_id=user_id,
        device=device,
        browser=browser,
        operating_system=operating_system,
        ip_address=ip_address,
        user_agent=user_agent,
        created_at=now,
        last_active_at=now,
        expires_at=expires_at,
        is_active=True,
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session


# ============================================================
# GET ACTIVE SESSIONS
# ============================================================

def get_active_sessions(
    user_id: int,
    db: Session,
    current_session_id: str | None = None,
):
    now = datetime.utcnow()

    # --------------------------------------------------------
    # MARK EXPIRED SESSIONS INACTIVE
    # --------------------------------------------------------

    expired_sessions = (
        db.query(UserSession)
        .filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
            UserSession.expires_at <= now,
        )
        .all()
    )

    for session in expired_sessions:
        session.is_active = False

    if expired_sessions:
        db.commit()

    # --------------------------------------------------------
    # GET ACTIVE SESSIONS
    # --------------------------------------------------------

    sessions = (
        db.query(UserSession)
        .filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
        )
        .order_by(
            UserSession.last_active_at.desc()
        )
        .all()
    )

    result = []

    for session in sessions:

        result.append(
            {
                # IMPORTANT:
                # Frontend uses session_id as the unique ID.
                "id": session.session_id,

                "device": session.device or "Unknown Device",

                "browser": session.browser or "Unknown Browser",

                "operating_system": (
                    session.operating_system
                    or "Unknown OS"
                ),

                "ip_address": (
                    session.ip_address
                    or "Unknown"
                ),

                "location": None,

                "last_active": (
                    session.last_active_at
                    if session.last_active_at
                    else session.created_at
                ),

                "created_at": session.created_at,

                "is_current": (
                    current_session_id is not None
                    and session.session_id
                    == current_session_id
                ),
            }
        )

    # --------------------------------------------------------
    # IMPORTANT:
    # FRONTEND EXPECTS { sessions: [...] }
    # --------------------------------------------------------

    return {
        "success": True,
        "sessions": result,
        "message": "Active sessions retrieved successfully.",
    }


# ============================================================
# UPDATE SESSION ACTIVITY
# ============================================================

def update_session_activity(
    session_id: str,
    db: Session,
):
    session = (
        db.query(UserSession)
        .filter(
            UserSession.session_id == session_id,
            UserSession.is_active == True,
        )
        .first()
    )

    if not session:
        return None

    now = datetime.utcnow()

    if session.expires_at <= now:
        session.is_active = False

        db.commit()

        return None

    session.last_active_at = now

    db.commit()

    return session


# ============================================================
# REVOKE ONE SESSION
# ============================================================

def revoke_session(
    user_id: int,
    session_id: str,
    db: Session,
    current_session_id: str | None = None,
):
    # --------------------------------------------------------
    # PREVENT CURRENT SESSION REVOCATION
    # --------------------------------------------------------

    if (
        current_session_id
        and session_id == current_session_id
    ):
        return {
            "success": False,
            "message": (
                "You cannot revoke your current session."
            ),
        }

    # --------------------------------------------------------
    # FIND SESSION
    # --------------------------------------------------------

    session = (
        db.query(UserSession)
        .filter(
            UserSession.session_id == session_id,
            UserSession.user_id == user_id,
            UserSession.is_active == True,
        )
        .first()
    )

    if not session:
        return {
            "success": False,
            "message": "Session not found.",
        }

    # --------------------------------------------------------
    # REVOKE
    # --------------------------------------------------------

    session.is_active = False

    db.commit()

    return {
        "success": True,
        "message": "Session revoked successfully.",
    }


# ============================================================
# REVOKE ALL OTHER SESSIONS
# ============================================================

def revoke_all_other_sessions(
    user_id: int,
    db: Session,
    current_session_id: str | None = None,
):
    query = (
        db.query(UserSession)
        .filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
        )
    )

    # --------------------------------------------------------
    # KEEP CURRENT SESSION
    # --------------------------------------------------------

    if current_session_id:
        query = query.filter(
            UserSession.session_id
            != current_session_id
        )

    sessions = query.all()

    count = 0

    for session in sessions:
        session.is_active = False
        count += 1

    db.commit()

    return {
        "success": True,
        "message": (
            f"{count} other session(s) "
            "revoked successfully."
        ),
    }


# ============================================================
# VALIDATE SESSION
# ============================================================

def validate_session(
    user_id: int,
    session_id: str,
    db: Session,
):
    session = (
        db.query(UserSession)
        .filter(
            UserSession.session_id == session_id,
            UserSession.user_id == user_id,
            UserSession.is_active == True,
        )
        .first()
    )

    if not session:
        return None

    now = datetime.utcnow()

    if session.expires_at <= now:
        session.is_active = False

        db.commit()

        return None

    session.last_active_at = now

    db.commit()

    return session