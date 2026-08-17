from sqlalchemy import Boolean, Column, Integer, String

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    # ============================================================
    # ID
    # ============================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ============================================================
    # FIRST NAME
    # ============================================================

    first_name = Column(
        String(100),
        nullable=False,
    )

    # ============================================================
    # LAST NAME
    # ============================================================

    last_name = Column(
        String(100),
        nullable=False,
    )

    # ============================================================
    # EMAIL
    # ============================================================

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    # ============================================================
    # PASSWORD
    # ============================================================

    password = Column(
        String(255),
        nullable=False,
    )

    # ============================================================
    # JOB TITLE
    # ============================================================

    job_title = Column(
        String(100),
        nullable=False,
        default="Software Developer",
    )

    # ============================================================
    # ORGANIZATION
    # ============================================================

    organization = Column(
        String(150),
        nullable=False,
        default="StoryPilot AI",
    )

    # ============================================================
    # MFA ENABLED
    # ============================================================

    mfa_enabled = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    # ============================================================
    # MFA OTP
    # ============================================================

    mfa_otp = Column(
        String(6),
        nullable=True,
    )

    # ============================================================
    # MFA OTP EXPIRY
    # ============================================================

    mfa_otp_expires_at = Column(
        String(50),
        nullable=True,
    )