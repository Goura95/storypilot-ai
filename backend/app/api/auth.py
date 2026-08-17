from fastapi import (
    APIRouter,
    Depends,
    Request,
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.user import (
    UserRegister,
    UserLogin,
    ChangePasswordRequest,
    UpdateProfileRequest,
)

from app.services.auth_service import (
    register_user,
    login_user,
    change_password,
    verify_mfa,
    get_mfa_status,
    enable_mfa,
    disable_mfa,
    update_profile,
    get_profile,
)

from app.security import get_current_user


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# ============================================================
# REGISTER
# ============================================================

@router.post("/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db),
):
    return register_user(
        user=user,
        db=db,
    )


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(
    user: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):

    user_agent = request.headers.get(
        "user-agent"
    )

    return login_user(
        user=user,
        db=db,
        device="Web Browser",
        browser="Browser",
        operating_system="Desktop",
        ip_address=(
            request.client.host
            if request.client
            else None
        ),
        user_agent=user_agent,
    )


# ============================================================
# CHANGE PASSWORD
# ============================================================

@router.post("/change-password")
def change_user_password(
    password_data: ChangePasswordRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return change_password(
        user_id=user_id,
        current_password=password_data.current_password,
        new_password=password_data.new_password,
        confirm_password=password_data.confirm_password,
        db=db,
    )


# ============================================================
# VERIFY MFA
# ============================================================

@router.post("/verify-mfa")
def verify_user_mfa(
    email: str,
    otp: str,
    request: Request,
    db: Session = Depends(get_db),
):

    user_agent = request.headers.get(
        "user-agent"
    )

    return verify_mfa(
        email=email,
        otp=otp,
        db=db,
        device="Web Browser",
        browser="Browser",
        operating_system="Desktop",
        ip_address=(
            request.client.host
            if request.client
            else None
        ),
        user_agent=user_agent,
    )


# ============================================================
# GET PROFILE
# ============================================================

@router.get("/profile")
def get_user_profile(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_profile(
        user_id=user_id,
        db=db,
    )


# ============================================================
# UPDATE PROFILE
# ============================================================

@router.put("/profile")
def update_user_profile(
    profile_data: UpdateProfileRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_profile(
        user_id=user_id,
        first_name=profile_data.first_name,
        last_name=profile_data.last_name,
        email=str(profile_data.email),
        job_title=profile_data.job_title,
        organization=profile_data.organization,
        db=db,
    )


# ============================================================
# MFA STATUS
# ============================================================

@router.get("/mfa/status")
def mfa_status(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_mfa_status(
        user_id=user_id,
        db=db,
    )


# ============================================================
# ENABLE MFA
# ============================================================

@router.post("/mfa/enable")
def enable_user_mfa(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return enable_mfa(
        user_id=user_id,
        db=db,
    )


# ============================================================
# DISABLE MFA
# ============================================================

@router.post("/mfa/disable")
def disable_user_mfa(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return disable_mfa(
        user_id=user_id,
        db=db,
    )