from sqlalchemy.orm import Session

from passlib.context import CryptContext

from app.models.user import User

from app.schemas.user import (
    UserRegister,
    UserLogin,
)

from app.security import create_access_token

from app.services.mfa_service import (
    create_and_send_mfa_otp,
    verify_mfa_otp,
)

from app.services.session_service import (
    create_session,
)


# ============================================================
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


# ============================================================
# REGISTER USER
# ============================================================

def register_user(
    user: UserRegister,
    db: Session,
):
    email = user.email.lower().strip()

    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if existing_user:
        return {
            "success": False,
            "message": "Email already exists.",
        }

    hashed_password = pwd_context.hash(
        user.password
    )

    new_user = User(
        first_name=user.first_name.strip(),
        last_name=user.last_name.strip(),
        email=email,
        password=hashed_password,
        job_title="Software Developer",
        organization="StoryPilot AI",
        mfa_enabled=False,
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {
        "success": True,
        "message": "User registered successfully.",
        "user_id": new_user.id,
        "user": serialize_user(new_user),
    }


# ============================================================
# LOGIN USER
# ============================================================

def login_user(
    user: UserLogin,
    db: Session,
    device: str = "Unknown Device",
    browser: str = "Unknown Browser",
    operating_system: str = "Unknown OS",
    ip_address: str | None = None,
    user_agent: str | None = None,
):
    email = user.email.lower().strip()

    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if not existing_user:
        return {
            "success": False,
            "message": "Invalid email or password.",
        }

    password_valid = pwd_context.verify(
        user.password,
        existing_user.password,
    )

    if not password_valid:
        return {
            "success": False,
            "message": "Invalid email or password.",
        }

    # ========================================================
    # MFA ENABLED
    # ========================================================

    if existing_user.mfa_enabled:

        try:

            create_and_send_mfa_otp(
                user=existing_user,
                db=db,
            )

        except Exception as error:

            print(
                "Failed to send MFA OTP:",
                error,
            )

            return {
                "success": False,
                "message": (
                    "Unable to send MFA verification code. "
                    "Please try again."
                ),
            }

        return {
            "success": True,
            "mfa_required": True,
            "message": (
                "MFA verification code sent "
                "to your registered email."
            ),
            "email": existing_user.email,
        }

    # ========================================================
    # CREATE SESSION
    # ========================================================

    new_session = create_session(
        user_id=existing_user.id,
        db=db,
        device=device,
        browser=browser,
        operating_system=operating_system,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # ========================================================
    # CREATE TOKEN
    # ========================================================

    access_token = create_access_token(
        data={
            "sub": str(existing_user.id),
            "email": existing_user.email,
            "sid": new_session.session_id,
        }
    )

    return {
        "success": True,
        "mfa_required": False,
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(existing_user),
    }


# ============================================================
# CHANGE PASSWORD
# ============================================================

def change_password(
    user_id: int,
    current_password: str,
    new_password: str,
    confirm_password: str,
    db: Session,
):
    if new_password != confirm_password:
        return {
            "success": False,
            "message": (
                "New password and confirm password "
                "do not match."
            ),
        }

    if current_password == new_password:
        return {
            "success": False,
            "message": (
                "New password must be different "
                "from the current password."
            ),
        }

    existing_user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not existing_user:
        return {
            "success": False,
            "message": "User not found.",
        }

    password_valid = pwd_context.verify(
        current_password,
        existing_user.password,
    )

    if not password_valid:
        return {
            "success": False,
            "message": "Current password is incorrect.",
        }

    hashed_password = pwd_context.hash(
        new_password
    )

    existing_user.password = hashed_password

    db.commit()

    return {
        "success": True,
        "message": "Password changed successfully.",
    }


# ============================================================
# VERIFY MFA
# ============================================================

def verify_mfa(
    email: str,
    otp: str,
    db: Session,
    device: str = "Unknown Device",
    browser: str = "Unknown Browser",
    operating_system: str = "Unknown OS",
    ip_address: str | None = None,
    user_agent: str | None = None,
):
    email = email.lower().strip()

    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if not existing_user:
        return {
            "success": False,
            "message": "Invalid verification request.",
        }

    if not existing_user.mfa_enabled:
        return {
            "success": False,
            "message": (
                "MFA is not enabled for this account."
            ),
        }

    otp_valid = verify_mfa_otp(
        user=existing_user,
        otp=otp,
        db=db,
    )

    if not otp_valid:
        return {
            "success": False,
            "message": "Invalid or expired MFA code.",
        }

    # ========================================================
    # CREATE SESSION
    # ========================================================

    new_session = create_session(
        user_id=existing_user.id,
        db=db,
        device=device,
        browser=browser,
        operating_system=operating_system,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # ========================================================
    # CREATE TOKEN
    # ========================================================

    access_token = create_access_token(
        data={
            "sub": str(existing_user.id),
            "email": existing_user.email,
            "sid": new_session.session_id,
        }
    )

    return {
        "success": True,
        "message": "MFA verification successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(existing_user),
    }


# ============================================================
# GET MFA STATUS
# ============================================================

def get_mfa_status(
    user_id: int,
    db: Session,
):
    existing_user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not existing_user:
        return {
            "success": False,
            "mfa_enabled": False,
            "message": "User not found.",
        }

    return {
        "success": True,
        "mfa_enabled": bool(
            existing_user.mfa_enabled
        ),
        "message": "MFA status retrieved successfully.",
    }


# ============================================================
# ENABLE MFA
# ============================================================

def enable_mfa(
    user_id: int,
    db: Session,
):
    existing_user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not existing_user:
        return {
            "success": False,
            "mfa_enabled": False,
            "message": "User not found.",
        }

    if existing_user.mfa_enabled:
        return {
            "success": True,
            "mfa_enabled": True,
            "message": "MFA is already enabled.",
        }

    existing_user.mfa_enabled = True

    db.commit()

    db.refresh(existing_user)

    return {
        "success": True,
        "mfa_enabled": True,
        "message": "MFA enabled successfully.",
    }


# ============================================================
# DISABLE MFA
# ============================================================

def disable_mfa(
    user_id: int,
    db: Session,
):
    existing_user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not existing_user:
        return {
            "success": False,
            "mfa_enabled": False,
            "message": "User not found.",
        }

    if not existing_user.mfa_enabled:
        return {
            "success": True,
            "mfa_enabled": False,
            "message": "MFA is already disabled.",
        }

    existing_user.mfa_enabled = False

    existing_user.mfa_otp = None

    existing_user.mfa_otp_expires_at = None

    db.commit()

    db.refresh(existing_user)

    return {
        "success": True,
        "mfa_enabled": False,
        "message": "MFA disabled successfully.",
    }


# ============================================================
# UPDATE PROFILE
# ============================================================

def update_profile(
    user_id: int,
    first_name: str,
    last_name: str,
    email: str,
    job_title: str,
    organization: str,
    db: Session,
):
    existing_user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not existing_user:
        return {
            "success": False,
            "message": "User not found.",
        }

    cleaned_first_name = first_name.strip()
    cleaned_last_name = last_name.strip()
    cleaned_email = email.lower().strip()
    cleaned_job_title = job_title.strip()
    cleaned_organization = organization.strip()

    if not cleaned_first_name:
        return {
            "success": False,
            "message": "First name cannot be empty.",
        }

    if not cleaned_last_name:
        return {
            "success": False,
            "message": "Last name cannot be empty.",
        }

    if not cleaned_email:
        return {
            "success": False,
            "message": "Email cannot be empty.",
        }

    if not cleaned_job_title:
        return {
            "success": False,
            "message": "Job title cannot be empty.",
        }

    if not cleaned_organization:
        return {
            "success": False,
            "message": "Organization cannot be empty.",
        }

    email_user = (
        db.query(User)
        .filter(
            User.email == cleaned_email,
            User.id != user_id,
        )
        .first()
    )

    if email_user:
        return {
            "success": False,
            "message": "Email address is already in use.",
        }

    existing_user.first_name = cleaned_first_name
    existing_user.last_name = cleaned_last_name
    existing_user.email = cleaned_email
    existing_user.job_title = cleaned_job_title
    existing_user.organization = cleaned_organization

    db.commit()

    db.refresh(existing_user)

    return {
        "success": True,
        "message": "Profile updated successfully.",
        "user": serialize_user(existing_user),
    }


# ============================================================
# GET PROFILE
# ============================================================

def get_profile(
    user_id: int,
    db: Session,
):
    existing_user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not existing_user:
        return {
            "success": False,
            "message": "User not found.",
            "user": {},
        }

    return {
        "success": True,
        "message": "Profile retrieved successfully.",
        "user": serialize_user(existing_user),
    }


# ============================================================
# SERIALIZE USER
# ============================================================

def serialize_user(
    user: User,
):
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
    }