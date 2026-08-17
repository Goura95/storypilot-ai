from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)

from app.database.database import Base


class UserSession(Base):
    __tablename__ = "user_sessions"

    # ============================================================
    # ID
    # ============================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ============================================================
    # SESSION ID
    # ============================================================

    session_id = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    # ============================================================
    # USER ID
    # ============================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # ============================================================
    # DEVICE
    # ============================================================

    device = Column(
        String(255),
        nullable=False,
        default="Unknown Device",
    )

    # ============================================================
    # BROWSER
    # ============================================================

    browser = Column(
        String(255),
        nullable=False,
        default="Unknown Browser",
    )

    # ============================================================
    # OPERATING SYSTEM
    # ============================================================

    operating_system = Column(
        String(255),
        nullable=False,
        default="Unknown OS",
    )

    # ============================================================
    # IP ADDRESS
    # ============================================================

    ip_address = Column(
        String(100),
        nullable=True,
    )

    # ============================================================
    # USER AGENT
    # ============================================================

    user_agent = Column(
        String(1000),
        nullable=True,
    )

    # ============================================================
    # CREATED AT
    # ============================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # ============================================================
    # LAST ACTIVE
    # ============================================================

    last_active_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # ============================================================
    # EXPIRES AT
    # ============================================================

    expires_at = Column(
        DateTime,
        nullable=False,
    )

    # ============================================================
    # ACTIVE
    # ============================================================

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )