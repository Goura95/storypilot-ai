import json

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.agents.orchestrator import generate_complete_story
from app.database.database import get_db
from app.models.story import Story
from app.schemas.story import StoryResponse
from app.security import get_current_user


# ============================================================
# ROUTER
# ============================================================

router = APIRouter()


# ============================================================
# JSON HELPER
# ============================================================

def parse_json_field(
    value,
    default,
):
    """
    Convert JSON stored as a string in the database
    into a Python object.
    """

    if value is None:
        return default

    if isinstance(
        value,
        (list, dict),
    ):
        return value

    if isinstance(
        value,
        str,
    ):

        try:
            return json.loads(value)

        except (
            json.JSONDecodeError,
            TypeError,
        ):
            return default

    return default


# ============================================================
# STORY RESPONSE HELPER
# ============================================================

def story_to_response(
    story: Story,
):
    """
    Convert the SQLAlchemy Story model into the
    10/10 StoryPilot API response structure.
    """

    return {
        # ====================================================
        # STORY IDENTIFICATION
        # ====================================================

        "id": story.id,

        "feature_name": story.feature_name,

        "title": story.title,

        "module": story.module,

        "priority": story.priority,

        "story_type": story.story_type,

        # ====================================================
        # BUSINESS VALUE
        # ====================================================

        "business_value": (
            story.business_value
            or ""
        ),

        # ====================================================
        # USER STORY
        # ====================================================

        "user_story": (
            story.user_story
            or ""
        ),

        # ====================================================
        # ACCEPTANCE CRITERIA
        # ====================================================

        "acceptance_criteria": parse_json_field(
            story.acceptance_criteria,
            [],
        ),

        # ====================================================
        # DEFINITION OF DONE
        # ====================================================

        "definition_of_done": parse_json_field(
            story.definition_of_done,
            [],
        ),

        # ====================================================
        # ASSUMPTIONS
        # ====================================================

        "assumptions": parse_json_field(
            story.assumptions,
            [],
        ),

        # ====================================================
        # DEPENDENCIES
        # ====================================================

        "dependencies": parse_json_field(
            story.dependencies,
            [],
        ),

        # ====================================================
        # QA TEST SCENARIOS
        # ====================================================

        "test_scenarios": parse_json_field(
            story.test_scenarios,
            [],
        ),

        # ====================================================
        # TECHNICAL ANALYSIS
        # ====================================================

        "technical_analysis": parse_json_field(
            story.technical_analysis,
            {},
        ),

        # ====================================================
        # STORY POINTS
        # ====================================================

        "story_points": story.story_points,

        "story_point_reason": (
            story.story_point_reason
            or ""
        ),

        "complexity": (
            story.complexity
            or "Medium"
        ),

        "estimation_factors": parse_json_field(
            story.estimation_factors,
            [],
        ),

        "should_split": bool(
            story.should_split
        ),

        "split_reason": (
            story.split_reason
            or ""
        ),

        # ====================================================
        # RISKS
        # ====================================================

        "overall_risk_level": (
            story.overall_risk_level
            or "Medium"
        ),

        "risk_summary": (
            story.risk_summary
            or ""
        ),

        "risks": parse_json_field(
            story.risks,
            [],
        ),

        # ====================================================
        # QUALITY REVIEW
        # ====================================================

        "quality_review": parse_json_field(
            story.quality_review,
            {},
        ),

        "quality_score": (
            story.quality_score
            or 0
        ),

        "approved_for_final_output": bool(
            story.approved_for_final_output
        ),

        # ====================================================
        # AUDIT
        # ====================================================

        "created_at": story.created_at,
    }


# ============================================================
# SAVE STORY
# ============================================================

def save_generated_story(
    db: Session,
    current_user_id: int,
    generated: dict,
):
    """
    Save the complete multi-agent output into the database.
    """

    story = Story(
        # ====================================================
        # STORY IDENTIFICATION
        # ====================================================

        user_id=current_user_id,

        feature_name=generated.get(
            "feature_name",
            "",
        ),

        title=generated.get(
            "title",
            "",
        ),

        module=generated.get(
            "module",
            "",
        ),

        priority=generated.get(
            "priority",
            "",
        ),

        story_type=generated.get(
            "story_type",
            "",
        ),

        # ====================================================
        # STORY CONTENT
        # ====================================================

        business_value=generated.get(
            "business_value",
            "",
        ),

        user_story=generated.get(
            "user_story",
            "",
        ),

        # ====================================================
        # STRUCTURED JSON
        # ====================================================

        acceptance_criteria=json.dumps(
            generated.get(
                "acceptance_criteria",
                [],
            )
        ),

        definition_of_done=json.dumps(
            generated.get(
                "definition_of_done",
                [],
            )
        ),

        assumptions=json.dumps(
            generated.get(
                "assumptions",
                [],
            )
        ),

        dependencies=json.dumps(
            generated.get(
                "dependencies",
                [],
            )
        ),

        test_scenarios=json.dumps(
            generated.get(
                "test_scenarios",
                [],
            )
        ),

        # ====================================================
        # TECHNICAL ANALYSIS
        # ====================================================

        technical_analysis=json.dumps(
            generated.get(
                "technical_analysis",
                {},
            )
        ),

        # ====================================================
        # STORY POINTS
        # ====================================================

        story_points=generated.get(
            "story_points",
            5,
        ),

        story_point_reason=generated.get(
            "story_point_reason",
            "",
        ),

        complexity=generated.get(
            "complexity",
            "Medium",
        ),

        estimation_factors=json.dumps(
            generated.get(
                "estimation_factors",
                [],
            )
        ),

        should_split=int(
            bool(
                generated.get(
                    "should_split",
                    False,
                )
            )
        ),

        split_reason=generated.get(
            "split_reason",
            "",
        ),

        # ====================================================
        # RISKS
        # ====================================================

        overall_risk_level=generated.get(
            "overall_risk_level",
            "Medium",
        ),

        risk_summary=generated.get(
            "risk_summary",
            "",
        ),

        risks=json.dumps(
            generated.get(
                "risks",
                [],
            )
        ),

        # ====================================================
        # QUALITY REVIEW
        # ====================================================

        quality_review=json.dumps(
            generated.get(
                "quality_review",
                {},
            )
        ),

        quality_score=int(
            generated.get(
                "quality_score",
                0,
            )
        ),

        approved_for_final_output=int(
            bool(
                generated.get(
                    "approved_for_final_output",
                    False,
                )
            )
        ),
    )

    db.add(
        story
    )

    db.commit()

    db.refresh(
        story
    )

    return story


# ============================================================
# CREATE / GENERATE STORY
# ============================================================

@router.post(
    "/generate-story",
    response_model=StoryResponse,
)
async def create_story(
    feature_name: str = Form(...),
    module: str = Form(...),
    priority: str = Form(...),
    story_type: str = Form(...),
    description: str = Form(...),
    requirement_image: UploadFile | None = File(
        None
    ),
    db: Session = Depends(
        get_db
    ),
    current_user_id: int = Depends(
        get_current_user
    ),
):

    # ========================================================
    # VALIDATE INPUT
    # ========================================================

    if not feature_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feature name is required.",
        )

    if not module.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Module is required.",
        )

    if not priority.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Priority is required.",
        )

    if not story_type.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Story type is required.",
        )

    if not description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requirement description is required.",
        )

    # ========================================================
    # READ IMAGE
    # ========================================================

    image_bytes = None

    image_content_type = None

    if requirement_image:

        image_bytes = (
            await requirement_image.read()
        )

        image_content_type = (
            requirement_image.content_type
            or "application/octet-stream"
        )

    # ========================================================
    # RUN MULTI-AGENT WORKFLOW
    # ========================================================

    try:

        generated = generate_complete_story(
            feature_name=feature_name,
            module=module,
            priority=priority,
            story_type=story_type,
            description=description,
            image_bytes=image_bytes,
            image_content_type=image_content_type,
        )

    except Exception as exc:

        print(
            "Multi-agent story generation failed:",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate story.",
        ) from exc

    # ========================================================
    # SAVE
    # ========================================================

    try:

        story = save_generated_story(
            db=db,
            current_user_id=current_user_id,
            generated=generated,
        )

    except Exception as exc:

        db.rollback()

        print(
            "Story database save failed:",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save generated story.",
        ) from exc

    # ========================================================
    # RETURN
    # ========================================================

    return story_to_response(
        story
    )


# ============================================================
# GET ALL STORIES
# ============================================================

@router.get(
    "/stories",
    response_model=list[StoryResponse],
)
def get_stories(
    db: Session = Depends(
        get_db
    ),
    current_user_id: int = Depends(
        get_current_user
    ),
):

    stories = (
        db.query(
            Story
        )
        .filter(
            Story.user_id
            == current_user_id
        )
        .order_by(
            Story.id.desc()
        )
        .all()
    )

    return [
        story_to_response(
            story
        )
        for story in stories
    ]


# ============================================================
# GET STORY BY ID
# ============================================================

@router.get(
    "/stories/{story_id}",
    response_model=StoryResponse,
)
def get_story_by_id(
    story_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user_id: int = Depends(
        get_current_user
    ),
):

    story = (
        db.query(
            Story
        )
        .filter(
            Story.id == story_id,
            Story.user_id
            == current_user_id,
        )
        .first()
    )

    if not story:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found.",
        )

    return story_to_response(
        story
    )


# ============================================================
# UPDATE STORY
# ============================================================

@router.put(
    "/stories/{story_id}",
    response_model=StoryResponse,
)
def update_story(
    story_id: int,
    feature_name: str = Form(...),
    title: str = Form(...),
    module: str = Form(...),
    priority: str = Form(...),
    story_type: str = Form(...),
    business_value: str = Form(...),
    user_story: str = Form(...),
    acceptance_criteria: str = Form(...),
    definition_of_done: str = Form(...),
    assumptions: str = Form("[]"),
    dependencies: str = Form("[]"),
    test_scenarios: str = Form(...),
    technical_analysis: str = Form("{}"),
    story_points: int = Form(...),
    story_point_reason: str = Form(""),
    complexity: str = Form("Medium"),
    estimation_factors: str = Form("[]"),
    should_split: bool = Form(False),
    split_reason: str = Form(""),
    overall_risk_level: str = Form("Medium"),
    risk_summary: str = Form(""),
    risks: str = Form("[]"),
    quality_review: str = Form("{}"),
    quality_score: int = Form(0),
    approved_for_final_output: bool = Form(False),
    db: Session = Depends(
        get_db
    ),
    current_user_id: int = Depends(
        get_current_user
    ),
):

    # ========================================================
    # FIND STORY
    # ========================================================

    story = (
        db.query(
            Story
        )
        .filter(
            Story.id == story_id,
            Story.user_id
            == current_user_id,
        )
        .first()
    )

    if not story:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found.",
        )

    # ========================================================
    # VALIDATE STORY POINTS
    # ========================================================

    if story_points not in {
        1,
        2,
        3,
        5,
        8,
        13,
    }:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid story points.",
        )

    # ========================================================
    # VALIDATE QUALITY SCORE
    # ========================================================

    if quality_score < 0 or quality_score > 10:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quality score must be between 0 and 10.",
        )

    # ========================================================
    # UPDATE BASIC FIELDS
    # ========================================================

    story.feature_name = feature_name

    story.title = title

    story.module = module

    story.priority = priority

    story.story_type = story_type

    story.business_value = business_value

    story.user_story = user_story

    # ========================================================
    # UPDATE JSON FIELDS
    # ========================================================

    story.acceptance_criteria = json.dumps(
        parse_json_field(
            acceptance_criteria,
            [],
        )
    )

    story.definition_of_done = json.dumps(
        parse_json_field(
            definition_of_done,
            [],
        )
    )

    story.assumptions = json.dumps(
        parse_json_field(
            assumptions,
            [],
        )
    )

    story.dependencies = json.dumps(
        parse_json_field(
            dependencies,
            [],
        )
    )

    story.test_scenarios = json.dumps(
        parse_json_field(
            test_scenarios,
            [],
        )
    )

    story.technical_analysis = json.dumps(
        parse_json_field(
            technical_analysis,
            {},
        )
    )

    story.estimation_factors = json.dumps(
        parse_json_field(
            estimation_factors,
            [],
        )
    )

    story.risks = json.dumps(
        parse_json_field(
            risks,
            [],
        )
    )

    story.quality_review = json.dumps(
        parse_json_field(
            quality_review,
            {},
        )
    )

    # ========================================================
    # STORY POINT INFORMATION
    # ========================================================

    story.story_points = story_points

    story.story_point_reason = (
        story_point_reason
    )

    story.complexity = complexity

    story.should_split = int(
        bool(
            should_split
        )
    )

    story.split_reason = (
        split_reason
    )

    # ========================================================
    # RISK INFORMATION
    # ========================================================

    story.overall_risk_level = (
        overall_risk_level
    )

    story.risk_summary = (
        risk_summary
    )

    # ========================================================
    # QUALITY INFORMATION
    # ========================================================

    story.quality_score = (
        quality_score
    )

    story.approved_for_final_output = int(
        bool(
            approved_for_final_output
        )
    )

    # ========================================================
    # SAVE
    # ========================================================

    try:

        db.commit()

        db.refresh(
            story
        )

    except Exception as exc:

        db.rollback()

        print(
            "Story update failed:",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update story.",
        ) from exc

    # ========================================================
    # RETURN
    # ========================================================

    return story_to_response(
        story
    )


# ============================================================
# DELETE STORY
# ============================================================

@router.delete(
    "/stories/{story_id}",
)
def delete_story(
    story_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user_id: int = Depends(
        get_current_user
    ),
):

    # ========================================================
    # FIND STORY
    # ========================================================

    story = (
        db.query(
            Story
        )
        .filter(
            Story.id == story_id,
            Story.user_id
            == current_user_id,
        )
        .first()
    )

    if not story:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found.",
        )

    # ========================================================
    # DELETE
    # ========================================================

    try:

        db.delete(
            story
        )

        db.commit()

    except Exception as exc:

        db.rollback()

        print(
            "Story deletion failed:",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete story.",
        ) from exc

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "message": "Story deleted successfully.",
        "id": story_id,
    }