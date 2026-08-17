from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.profile import (
    ProfileResponse,
    ProfileUpdateRequest,
)
from app.security import get_current_user


router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"],
)


# ============================================================
# GET PROFILE
# ============================================================

@router.get(
    "",
    response_model=ProfileResponse,
)
def get_profile(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == current_user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


# ============================================================
# UPDATE PROFILE
# ============================================================

@router.put(
    "",
    response_model=ProfileResponse,
)
def update_profile(
    data: ProfileUpdateRequest,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == current_user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    existing_user = (
        db.query(User)
        .filter(
            User.email == data.email,
            User.id != current_user_id,
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email address is already in use.",
        )

    user.first_name = data.first_name.strip()
    user.last_name = data.last_name.strip()
    user.email = data.email.strip()

    db.commit()
    db.refresh(user)

    return user