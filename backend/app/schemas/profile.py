from pydantic import BaseModel, EmailStr


class ProfileResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr


class ProfileUpdateRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr