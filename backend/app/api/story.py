import json
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.concurrency import run_in_threadpool

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.story import Story
from app.schemas.story import StoryResponse
from app.security import get_current_user
from app.services.groq_service import (
    GroqConfigurationError,
    GroqRateLimitError,
    generate_story,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api",
    tags=["Story"],
)


# ============================================================
# JSON HELPER
# ============================================================

def parse_json_field(value, default):

    if value is None:
        return default

    if isinstance(value, (list, dict)):
        return value

    if isinstance(value, str):

        try:
            return json.loads(value)

        except (
            json.JSONDecodeError,
            TypeError,
        ):
            return default

    return default


# ============================================================
# FALLBACK STORY CONTENT
# ============================================================

DEFAULT_DEFINITION_OF_DONE = [
    "Development is complete.",
    "Code review is complete.",
    "Unit tests pass.",
    "Functional testing is complete.",
    "Acceptance criteria are validated.",
    "Negative scenarios are validated.",
    "Security and authorization are validated.",
    "Error handling is validated.",
    "Documentation is updated.",
    "No critical or high defects remain open.",
    "Build and code-quality checks pass.",
]


def build_fallback_acceptance_criteria(user_story: str):
    """Provide usable criteria when an AI response contains placeholders."""

    story_summary = " ".join((user_story or "").split())

    if not story_summary:
        story_summary = "the requested feature"

    return [
        {
            "id": "AC001",
            "criterion": (
                "An authorized user can complete the requested workflow: "
                f"{story_summary}"
            ),
            "given": "An authorized user has access to the feature.",
            "when": "The user completes the requested workflow.",
            "then": "The system completes the workflow successfully.",
        },
        {
            "id": "AC002",
            "criterion": "The system validates required input before processing the request.",
            "given": "The user is submitting information for the workflow.",
            "when": "Required information is missing or invalid.",
            "then": "The system shows a clear validation message and prevents invalid processing.",
        },
        {
            "id": "AC003",
            "criterion": "A successful workflow produces a clear, usable result for the user.",
            "given": "The user provides valid information.",
            "when": "The system processes the request.",
            "then": "The user receives confirmation and can use the resulting information.",
        },
    ]


# ============================================================
# ACCEPTANCE CRITERIA NORMALIZER
# ============================================================

def normalize_acceptance_criteria(value):

    parsed = parse_json_field(
        value,
        [],
    )

    if not isinstance(parsed, list):
        return []

    normalized = []

    for index, item in enumerate(parsed):

        # ----------------------------------------------------
        # OBJECT FORMAT
        # ----------------------------------------------------

        if isinstance(item, dict):

            criterion_id = (
                item.get("id")
                or f"AC{index + 1:03d}"
            )

            given = (
                item.get("given")
                or ""
            ).strip()

            when = (
                item.get("when")
                or ""
            ).strip()

            then = (
                item.get("then")
                or ""
            ).strip()

            # ------------------------------------------------
            # Existing criterion/description support
            # ------------------------------------------------

            criterion = (
                item.get("criterion")
                or item.get("description")
                or ""
            ).strip()

            # ------------------------------------------------
            # If criterion is missing but GWT exists,
            # construct criterion automatically.
            # ------------------------------------------------

            if not criterion:

                parts = []

                if given:
                    parts.append(
                        f"Given {given}"
                    )

                if when:
                    parts.append(
                        f"When {when}"
                    )

                if then:
                    parts.append(
                        f"Then {then}"
                    )

                criterion = " ".join(parts)

            # ------------------------------------------------
            # If GWT is missing but criterion exists,
            # keep GWT fields valid for the response schema.
            # ------------------------------------------------

            if not given and criterion:
                given = "The user has access to the required feature."

            if not when and criterion:
                when = criterion

            if not then and criterion:
                then = criterion

            # ------------------------------------------------
            # Skip completely empty criteria
            # ------------------------------------------------

            if not criterion.strip():
                continue

            normalized.append(
                {
                    "id": str(
                        criterion_id
                    ),
                    "criterion": criterion,
                    "given": given,
                    "when": when,
                    "then": then,
                }
            )

        # ----------------------------------------------------
        # STRING FORMAT
        # ----------------------------------------------------

        elif isinstance(item, str):

            criterion = item.strip()

            if not criterion:
                continue

            normalized.append(
                {
                    "id": f"AC{index + 1:03d}",
                    "criterion": criterion,
                    "given": (
                        "The user has access to "
                        "the required feature."
                    ),
                    "when": criterion,
                    "then": criterion,
                }
            )

    return normalized


# ============================================================
# TEST SCENARIO NORMALIZER
# ============================================================

def normalize_test_scenarios(value):

    parsed = parse_json_field(
        value,
        [],
    )

    if not isinstance(parsed, list):
        return []

    normalized = []

    def text_value(item):
        """Make AI-provided values safe for the string response contract."""
        if isinstance(item, str):
            return item.strip()
        if item is None:
            return ""
        if isinstance(item, (dict, list)):
            return json.dumps(item, ensure_ascii=False)
        return str(item)

    for index, item in enumerate(parsed):

        if not isinstance(item, dict):
            continue

        # Re-sequence persisted and newly-generated cases per story. This
        # prevents an AI-provided/global counter leaking into a new story.
        test_case_id = f"TC{index + 1:03d}"

        acceptance_criteria_ids = (
            item.get("acceptance_criteria_ids")
            or []
        )

        if not isinstance(
            acceptance_criteria_ids,
            list,
        ):
            acceptance_criteria_ids = []

        steps = item.get(
            "steps",
            [],
        )

        if not isinstance(steps, list):
            steps = []

        normalized.append(
            {
                "test_case_id": test_case_id,
                "acceptance_criteria_ids": (
                    acceptance_criteria_ids
                ),
                "scenario": (
                    item.get(
                        "scenario",
                        "",
                    )
                    or ""
                ),
                "test_type": (
                    item.get(
                        "test_type",
                        "Functional",
                    )
                    or "Functional"
                ),
                "preconditions": (
                    item.get(
                        "preconditions",
                        "",
                    )
                    or ""
                ),
                "steps": steps,
                "test_data": text_value(item.get("test_data", "")),
                "expected_result": (
                    item.get(
                        "expected_result",
                        "",
                    )
                    or ""
                ),
                "priority": (
                    item.get(
                        "priority",
                        "Medium",
                    )
                    or "Medium"
                ),
            }
        )

    return normalized


# ============================================================
# STORY RESPONSE HELPER
# ============================================================

def story_to_response(
    story: Story,
):
    story_data = parse_json_field(
        story.story_data,
        {},
    )

    if not isinstance(story_data, dict):
        story_data = {}

    def list_value(name):
        value = story_data.get(name, [])
        return value if isinstance(value, list) else []

    acceptance_criteria = (
        normalize_acceptance_criteria(
            story.acceptance_criteria
        )
    )

    if not acceptance_criteria:
        acceptance_criteria = (
            build_fallback_acceptance_criteria(
                story.user_story
            )
        )

    definition_of_done = parse_json_field(
        story.definition_of_done,
        [],
    )

    if not isinstance(
        definition_of_done,
        list,
    ):
        definition_of_done = []

    if not definition_of_done:
        definition_of_done = DEFAULT_DEFINITION_OF_DONE

    test_scenarios = (
        normalize_test_scenarios(
            story.test_scenarios
        )
    )

    return {
        "id": story.id,

        "feature_name": story.feature_name,

        "title": story.title,

        "module": story.module,

        "priority": story.priority,

        "story_type": story.story_type,

        "user_role": story_data.get("user_role", ""),

        "business_value": (
            story.business_value
            or ""
        ),

        "user_story": story.user_story,

        "product_outcome": story_data.get("product_outcome", ""),
        "requirement_summary": story_data.get("requirement_summary", ""),
        "requirement_quality": story_data.get("requirement_quality", ""),
        "business_rules": list_value("business_rules"),
        "preconditions": list_value("preconditions"),
        "assumptions": list_value("assumptions"),
        "dependencies": list_value("dependencies"),
        "edge_cases": list_value("edge_cases"),
        "clarification_questions": list_value("clarification_questions"),

        "acceptance_criteria": (
            acceptance_criteria
        ),

        "definition_of_done": (
            definition_of_done
        ),

        "test_scenarios": (
            test_scenarios
        ),

        "technical_analysis": story_data.get("technical_analysis", {}),
        "overall_risk_level": story_data.get("overall_risk_level", ""),
        "risk_summary": story_data.get("risk_summary", ""),
        "risks": list_value("risks"),

        "story_points": (
            story.story_points
            or 5
        ),

        "story_point_reason": story_data.get("story_point_reason", ""),
        "complexity": story_data.get("complexity", ""),
        "estimation_factors": list_value("estimation_factors"),
        "should_split": bool(story_data.get("should_split", False)),
        "split_reason": story_data.get("split_reason", ""),
        "traceability": story_data.get("traceability", {}),
        "quality_review": story_data.get("quality_review", {}),
        "quality_score": story_data.get("quality_score", 0),
        "review_status": story_data.get("review_status", ""),
        "review_summary": story_data.get("review_summary", ""),
        "missing_acceptance_criteria": list_value("missing_acceptance_criteria"),
        "uncovered_acceptance_criteria": list_value("uncovered_acceptance_criteria"),
        "recommendations": list_value("recommendations"),
        "approved_for_final_output": bool(story_data.get("approved_for_final_output", False)),

        "created_at": story.created_at,
    }


# ============================================================
# GENERATE STORY
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

    db: Session = Depends(get_db),

    current_user_id: int = Depends(
        get_current_user
    ),
):

    request_id = uuid4().hex[:12]

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
    # GENERATE STORY
    # ========================================================

    try:

        # The multi-agent Groq workflow is synchronous and can take minutes.
        # Running it in the thread pool keeps the ASGI event loop responsive
        # for health checks and avoids proxy connection resets.
        generated = await run_in_threadpool(
            generate_story,
            feature_name=feature_name,
            module=module,
            priority=priority,
            story_type=story_type,
            description=description,
            image_bytes=image_bytes,
            image_content_type=image_content_type,
        )

    except GroqRateLimitError as exc:

        print(
            f"Story generation failed [request_id={request_id}, stage=consolidated_agent]: "
            f"rate limit ({type(exc).__name__})",
        )

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "STORY_GENERATION_RATE_LIMITED", "message": "AI capacity is temporarily limited. Please try again in a minute.", "stage": "consolidated_agent", "request_id": request_id},
        ) from exc

    except GroqConfigurationError as exc:

        print(
            f"Story generation failed [request_id={request_id}, stage=consolidated_agent]: "
            f"configuration error ({type(exc).__name__})",
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "STORY_GENERATION_CONFIGURATION_ERROR", "message": "The configured AI model is unavailable.", "stage": "consolidated_agent", "request_id": request_id},
        ) from exc

    except Exception as exc:

        print(
            f"Story generation failed [request_id={request_id}, stage=consolidated_agent]: "
            f"{type(exc).__name__}: {exc}",
        )

        message = str(exc).lower()
        if (
            "invalid json" in message
            or "incomplete json" in message
            or "empty response" in message
        ):
            detail = (
                "The AI response was incomplete. Please retry; if it persists, "
                "shorten the requirement or try again after a minute."
            )
            status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        elif "timeout" in message or "timed out" in message:
            detail = "Story generation timed out. Please retry in a moment."
            status_code = status.HTTP_504_GATEWAY_TIMEOUT
        else:
            detail = "Story generation service failed. Please retry in a moment."
            status_code = status.HTTP_502_BAD_GATEWAY

        raise HTTPException(
            status_code=status_code,
            detail={"code": "STORY_GENERATION_INVALID_RESPONSE" if status_code == status.HTTP_422_UNPROCESSABLE_ENTITY else "STORY_GENERATION_FAILED", "message": detail, "stage": "consolidated_agent", "request_id": request_id},
        ) from exc

    # ========================================================
    # VALIDATE GENERATED OBJECT
    # ========================================================

    if not isinstance(
        generated,
        dict,
    ):

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "AI returned an invalid story."
            ),
        )

    # ========================================================
    # EXTRACT BASIC DATA
    # ========================================================

    title = (
        generated.get(
            "title",
            "",
        )
        or feature_name
    )

    generated_module = (
        generated.get(
            "module",
            module,
        )
        or module
    )

    generated_priority = (
        generated.get(
            "priority",
            priority,
        )
        or priority
    )

    generated_story_type = (
        generated.get(
            "story_type",
            story_type,
        )
        or story_type
    )

    business_value = (
        generated.get(
            "business_value",
            "",
        )
        or ""
    )

    user_story = (
        generated.get(
            "user_story",
            "",
        )
        or ""
    )

    # ========================================================
    # STRUCTURED DATA
    # ========================================================

    acceptance_criteria = (
        normalize_acceptance_criteria(
            generated.get(
                "acceptance_criteria",
                [],
            )
        )
    )

    if not acceptance_criteria:
        acceptance_criteria = (
            build_fallback_acceptance_criteria(
                user_story
            )
        )

    definition_of_done = (
        generated.get(
            "definition_of_done",
            [],
        )
    )

    if not isinstance(
        definition_of_done,
        list,
    ):
        definition_of_done = []

    definition_of_done = [
        item.strip()
        for item in definition_of_done
        if isinstance(item, str) and item.strip()
    ]

    if not definition_of_done:
        definition_of_done = DEFAULT_DEFINITION_OF_DONE

    test_scenarios = (
        normalize_test_scenarios(
            generated.get(
                "test_scenarios",
                [],
            )
        )
    )

    # ========================================================
    # STORY POINTS
    # ========================================================

    story_points = generated.get(
        "story_points",
        5,
    )

    if story_points not in [
        1,
        2,
        3,
        5,
        8,
        13,
    ]:

        story_points = 5

    # ========================================================
    # VALIDATION
    # ========================================================

    if not title.strip():

        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "Generated story title is empty."
            ),
        )

    if not user_story.strip():

        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "Generated user story is empty."
            ),
        )

    # ========================================================
    # SAVE STORY
    # ========================================================

    story = Story(

        user_id=current_user_id,

        feature_name=feature_name,

        title=title,

        module=generated_module,

        priority=generated_priority,

        story_type=generated_story_type,

        business_value=business_value,

        user_story=user_story,

        acceptance_criteria=json.dumps(
            acceptance_criteria
        ),

        definition_of_done=json.dumps(
            definition_of_done
        ),

        test_scenarios=json.dumps(
            test_scenarios
        ),

        story_points=story_points,

        story_data=json.dumps(generated),
    )

    db.add(story)

    db.commit()

    db.refresh(story)

    # ========================================================
    # RETURN
    # ========================================================

    return story_to_response(
        story
    )


# ============================================================
# GET STORY BY ID
# ============================================================

@router.post(
    "/stories/{story_id}/approve-review",
    response_model=StoryResponse,
)
def approve_story_review(
    story_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user),
):
    """Record the user's approval after reviewing a generated story."""

    story = (
        db.query(Story)
        .filter(
            Story.id == story_id,
            Story.user_id == current_user_id,
        )
        .first()
    )

    # story_data is the canonical document retained for Create -> View. Mirror
    # the normalized persisted sections into it so the generated response and a
    # later fetch cannot disagree on IDs or fields.
    generated.update({
        "feature_name": feature_name,
        "title": title,
        "module": generated_module,
        "priority": generated_priority,
        "story_type": generated_story_type,
        "business_value": business_value,
        "user_story": user_story,
        "acceptance_criteria": acceptance_criteria,
        "definition_of_done": definition_of_done,
        "test_scenarios": test_scenarios,
    })

    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found.",
        )

    story_data = parse_json_field(story.story_data, {})
    if not isinstance(story_data, dict):
        story_data = {}

    if story_data.get("approved_for_final_output"):
        return story_to_response(story)

    story_data["approved_for_final_output"] = True
    story_data["review_status"] = "PASS"
    story_data["review_summary"] = (
        "Approved by the user after review."
    )

    quality_review = story_data.get("quality_review", {})
    if not isinstance(quality_review, dict):
        quality_review = {}
    quality_review["status"] = "PASS"
    quality_review["summary"] = story_data["review_summary"]
    story_data["quality_review"] = quality_review

    story.story_data = json.dumps(story_data)
    story.approved_for_final_output = 1
    db.commit()
    db.refresh(story)

    return story_to_response(story)


@router.get(
    "/stories/{story_id}",
    response_model=StoryResponse,
)
def get_story_by_id(

    story_id: int,

    db: Session = Depends(get_db),

    current_user_id: int = Depends(
        get_current_user
    ),
):

    story = (
        db.query(Story)
        .filter(
            Story.id == story_id,
            Story.user_id == current_user_id,
        )
        .first()
    )

    if not story:

        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
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

    test_scenarios: str = Form(...),

    story_points: int = Form(...),

    db: Session = Depends(get_db),

    current_user_id: int = Depends(
        get_current_user
    ),
):

    story = (
        db.query(Story)
        .filter(
            Story.id == story_id,
            Story.user_id == current_user_id,
        )
        .first()
    )

    if not story:

        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Story not found.",
        )

    # ========================================================
    # STORY POINT VALIDATION
    # ========================================================

    if story_points not in [
        1,
        2,
        3,
        5,
        8,
        13,
    ]:

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail="Invalid story points.",
        )

    # ========================================================
    # PARSE DATA
    # ========================================================

    parsed_acceptance_criteria = (
        normalize_acceptance_criteria(
            acceptance_criteria
        )
    )

    parsed_definition_of_done = (
        parse_json_field(
            definition_of_done,
            [],
        )
    )

    parsed_test_scenarios = (
        normalize_test_scenarios(
            test_scenarios
        )
    )

    # ========================================================
    # UPDATE
    # ========================================================

    story.feature_name = feature_name

    story.title = title

    story.module = module

    story.priority = priority

    story.story_type = story_type

    story.business_value = business_value

    story.user_story = user_story

    story.acceptance_criteria = json.dumps(
        parsed_acceptance_criteria
    )

    story.definition_of_done = json.dumps(
        parsed_definition_of_done
    )

    story.test_scenarios = json.dumps(
        parsed_test_scenarios
    )

    story.story_points = story_points

    # Keep the full JSON document in lockstep with editable core fields.  The
    # detail page reads advanced sections from story_data, so leaving it stale
    # caused Create/Edit/View data loss and contradictory output.
    story_data = parse_json_field(story.story_data, {})
    if not isinstance(story_data, dict):
        story_data = {}
    story_data.update({
        "feature_name": feature_name,
        "title": title,
        "module": module,
        "priority": priority,
        "story_type": story_type,
        "business_value": business_value,
        "user_story": user_story,
        "acceptance_criteria": parsed_acceptance_criteria,
        "definition_of_done": parsed_definition_of_done,
        "test_scenarios": parsed_test_scenarios,
        "story_points": story_points,
    })
    story.story_data = json.dumps(story_data)

    # ========================================================
    # SAVE
    # ========================================================

    db.commit()

    db.refresh(story)

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

    db: Session = Depends(get_db),

    current_user_id: int = Depends(
        get_current_user
    ),
):

    story = (
        db.query(Story)
        .filter(
            Story.id == story_id,
            Story.user_id == current_user_id,
        )
        .first()
    )

    if not story:

        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Story not found.",
        )

    db.delete(story)

    db.commit()

    return {
        "message": (
            "Story deleted successfully."
        ),
        "id": story_id,
    }
