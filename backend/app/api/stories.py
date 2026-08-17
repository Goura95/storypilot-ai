from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.story import Story
from app.schemas.story import StoryResponse
from app.security import get_current_user
from app.api.story import story_to_response


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api",
    tags=["Stories"],
)


# ============================================================
# GET ALL STORIES
# ============================================================

@router.get(
    "/stories",
    response_model=list[StoryResponse],
)
def get_stories(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user),
):

    stories = (
        db.query(Story)
        .filter(
            Story.user_id == current_user_id
        )
        .order_by(
            Story.id.desc()
        )
        .all()
    )

    # Use the same normalizer as the individual-story endpoint. Older rows
    # may store criteria or test scenarios in legacy JSON formats; returning
    # them directly makes FastAPI's StoryResponse validation raise a 500.
    return [
        story_to_response(story)
        for story in stories
    ]
