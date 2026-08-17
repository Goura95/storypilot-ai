from pydantic import BaseModel, EmailStr, Field


# ============================================================
# REGISTER
# ============================================================

class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str


# ============================================================
# LOGIN
# ============================================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ============================================================
# CHANGE PASSWORD
# ============================================================

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(
        min_length=1
    )

    new_password: str = Field(
        min_length=8
    )

    confirm_password: str = Field(
        min_length=8
    )


# ============================================================
# UPDATE PROFILE REQUEST
# ============================================================

class UpdateProfileRequest(BaseModel):
    first_name: str = Field(
        min_length=1,
        max_length=100,
    )

    last_name: str = Field(
        min_length=1,
        max_length=100,
    )

    email: EmailStr

    job_title: str = Field(
        min_length=1,
        max_length=100,
    )

    organization: str = Field(
        min_length=1,
        max_length=150,
    )


# ============================================================
# PROFILE RESPONSE
# ============================================================

class ProfileResponse(BaseModel):
    success: bool
    message: str

    user: dict


# ============================================================
# MFA STATUS RESPONSE
# ============================================================

class MFAStatusResponse(BaseModel):
    success: bool
    mfa_enabled: bool
    message: str


# ============================================================
# MFA TOGGLE RESPONSE
# ============================================================

class MFAToggleResponse(BaseModel):
    success: bool
    mfa_enabled: bool
    message: str