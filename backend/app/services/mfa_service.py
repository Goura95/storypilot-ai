import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.user import User
from app.services.email_service import send_mfa_otp


# ============================================================
# MFA OTP CONFIGURATION
# ============================================================

OTP_EXPIRY_MINUTES = 5


# ============================================================
# CREATE AND SEND MFA OTP
# ============================================================

def create_and_send_mfa_otp(
    user: User,
    db: Session,
):

    # --------------------------------------------------------
    # GENERATE 6-DIGIT OTP
    # --------------------------------------------------------

    otp = str(
        random.randint(
            100000,
            999999,
        )
    )

    # --------------------------------------------------------
    # OTP EXPIRY
    # --------------------------------------------------------

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=OTP_EXPIRY_MINUTES
        )
    )

    # --------------------------------------------------------
    # SAVE OTP
    # --------------------------------------------------------

    user.mfa_otp = otp

    user.mfa_otp_expires_at = (
        expires_at.isoformat()
    )

    db.commit()

    # --------------------------------------------------------
    # SEND OTP USING RESEND
    # --------------------------------------------------------

    send_mfa_otp(
        recipient_email=user.email,
        otp=otp,
    )

    return True


# ============================================================
# VERIFY MFA OTP
# ============================================================

def verify_mfa_otp(
    user: User,
    otp: str,
    db: Session,
):

    # --------------------------------------------------------
    # CHECK OTP EXISTS
    # --------------------------------------------------------

    if not user.mfa_otp:
        return False

    if not user.mfa_otp_expires_at:
        return False

    # --------------------------------------------------------
    # COMPARE OTP
    # --------------------------------------------------------

    if str(otp).strip() != str(user.mfa_otp).strip():
        return False

    # --------------------------------------------------------
    # PARSE EXPIRY
    # --------------------------------------------------------

    try:

        expires_at = datetime.fromisoformat(
            user.mfa_otp_expires_at
        )

    except ValueError:

        return False

    # --------------------------------------------------------
    # ENSURE UTC
    # --------------------------------------------------------

    if expires_at.tzinfo is None:

        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    # --------------------------------------------------------
    # CHECK EXPIRY
    # --------------------------------------------------------

    if datetime.now(timezone.utc) > expires_at:

        # Clear expired OTP
        user.mfa_otp = None
        user.mfa_otp_expires_at = None

        db.commit()

        return False

    # --------------------------------------------------------
    # OTP VALID
    # --------------------------------------------------------

    # Clear OTP after successful verification
    user.mfa_otp = None
    user.mfa_otp_expires_at = None

    db.commit()

    return True