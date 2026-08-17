from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import (
    Base,
    engine,
    ensure_story_schema,
)

# ============================================================
# IMPORT MODELS
# ============================================================

from app.models.user import User
from app.models.story import Story
from app.models.session import UserSession


# ============================================================
# IMPORT ROUTERS
# ============================================================

from app.api.auth import router as auth_router
from app.api.story import router as story_router
from app.api.stories import router as stories_router
from app.api.analytics import router as analytics_router
from app.api.sessions import router as sessions_router
from app.api.profile import router as profile_router


# ============================================================
# CREATE TABLES
# ============================================================

Base.metadata.create_all(
    bind=engine
)

ensure_story_schema()


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="StoryPilot AI API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost",
        "http://127.0.0.1",
    ],

    allow_credentials=True,

    allow_methods=[
        "*"
    ],

    allow_headers=[
        "*"
    ],
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}


@app.get("/api/health")
def api_health_check():
    return {"status": "ok", "message": "API is running"}


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    auth_router
)

app.include_router(
    story_router
)

app.include_router(
    stories_router
)

app.include_router(
    analytics_router
)

app.include_router(
    sessions_router
)

app.include_router(
    profile_router
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": (
            "StoryPilot AI API is running."
        )
    }
