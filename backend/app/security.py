from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from fastapi import (
    Depends,
    HTTPException,
    status,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.session_service import (
    validate_session,
)


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = "storypilot-super-secret-key-change-this"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ============================================================
# BEARER SECURITY
# ============================================================

security = HTTPBearer()


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
):

    to_encode = data.copy()

    if expires_delta:

        expire = (
            datetime.now(timezone.utc)
            + expires_delta
        )

    else:

        expire = (
            datetime.now(timezone.utc)
            + timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )

    to_encode.update(
        {
            "exp": expire,
        }
    )

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return encoded_jwt


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
):

    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")
        session_id = payload.get("sid")

        if user_id is None:
            raise credentials_exception

        if session_id is None:
            raise credentials_exception

        user_id = int(user_id)

        session = validate_session(
            user_id=user_id,
            session_id=session_id,
            db=db,
        )

        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or revoked.",
                headers={
                    "WWW-Authenticate": "Bearer"
                },
            )

        return user_id

    except HTTPException:
        raise

    except (
        JWTError,
        ValueError,
        TypeError,
    ):

        raise credentials_exception


# ============================================================
# GET CURRENT SESSION ID
# ============================================================

def get_current_session_id(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
):
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        session_id = payload.get("sid")

        if not session_id:
            raise credentials_exception

        return session_id

    except (
        JWTError,
        ValueError,
        TypeError,
    ):

        raise credentials_exception