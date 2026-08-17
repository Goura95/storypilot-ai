import json
from typing import Any

import httpx
from groq import Groq

from app.config import GROQ_API_KEY, GROQ_STORY_MODEL


# ============================================================
# CUSTOM EXCEPTIONS
# ============================================================

class GroqRateLimitError(Exception):
    """Raised when Groq API rate limit is exceeded."""
    pass


class GroqConfigurationError(Exception):
    """Raised when the configured Groq model or credentials are unavailable."""
    pass


def is_rate_limit_error(exc: Exception) -> bool:
    """
    Public helper: check if an exception is a Groq rate limit error.

    Agents use this to convert raw Groq 429 exceptions into
    GroqRateLimitError so the API layer can return a clear 429
    response instead of a generic 500.
    """
    return _is_rate_limit_error(exc)


# ============================================================
# GROQ CLIENT
# ============================================================
#
# The Groq SDK default read timeout is 60 seconds. The multi-agent
# pipeline performs several sequential LLM calls, and a single call
# can legitimately take longer than 60 seconds under load. Increase
# the timeout so the pipeline does not fail with "Request timed out"
# while Groq is still processing.
#
# ============================================================

client = Groq(
    api_key=GROQ_API_KEY,
    timeout=httpx.Timeout(
        connect=10.0,
        read=300.0,
        write=300.0,
        pool=300.0,
    ),
    max_retries=5,
)


# ============================================================
# MODEL
# ============================================================

MODEL = GROQ_STORY_MODEL


# ============================================================
# DEFAULT GENERATION SETTINGS
# ============================================================

DEFAULT_TEMPERATURE = 0.2


# ============================================================
# HELPER: CHECK IF EXCEPTION IS RATE LIMIT ERROR
# ============================================================

def _is_rate_limit_error(exc: Exception) -> bool:
    """
    Check if an exception is due to a rate limit error.
    
    Checks for:
    - Exception status code 429
    - Error message containing 'rate_limit_exceeded' or 'Rate limit'
    """
    
    exc_str = str(exc).lower()
    
    if "rate_limit" in exc_str or "429" in exc_str:
        return True
    
    # Check for Groq API error structure
    if hasattr(exc, 'status_code') and exc.status_code == 429:
        return True
    
    return False


# ============================================================
# GROQ JSON GENERATION
# ============================================================

def generate_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float = DEFAULT_TEMPERATURE,
) -> dict[str, Any]:
    """
    Send a prompt to Groq and return a JSON object.

    This is the common LLM utility used by the
    StoryPilot AI agents.
    """

    if not system_prompt or not system_prompt.strip():
        raise ValueError(
            "System prompt is required."
        )

    if not user_prompt or not user_prompt.strip():
        raise ValueError(
            "User prompt is required."
        )

    try:

        completion = client.chat.completions.create(
            model=MODEL,
            temperature=temperature,
            response_format={
                "type": "json_object"
            },
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )

    except Exception as exc:

        if _is_rate_limit_error(exc):

            print(
                "Groq rate limit exceeded:",
                exc,
            )

            raise GroqRateLimitError(
                "Groq API rate limit exceeded. Please try again later."
            ) from exc

        print(
            "Groq API request failed:",
            exc,
        )

        raise Exception(
            "Unable to communicate with Groq."
        ) from exc

    # ========================================================
    # EXTRACT RESPONSE
    # ========================================================

    content = (
        completion
        .choices[0]
        .message
        .content
    )

    if not content:
        raise Exception(
            "Groq returned an empty response."
        )

    # ========================================================
    # PARSE JSON
    # ========================================================

    try:

        parsed = json.loads(
            content
        )

    except json.JSONDecodeError as exc:

        print(
            "Groq returned invalid JSON:",
            content,
        )

        raise Exception(
            "Groq returned invalid JSON."
        ) from exc

    # ========================================================
    # VALIDATE OBJECT
    # ========================================================

    if not isinstance(
        parsed,
        dict,
    ):
        raise Exception(
            "Groq response must be a JSON object."
        )

    return parsed


# ============================================================
# TEXT GENERATION
# ============================================================

def generate_text(
    system_prompt: str,
    user_prompt: str,
    temperature: float = DEFAULT_TEMPERATURE,
) -> str:
    """
    Generic text-generation helper.

    Use this only when an agent requires plain text.
    """

    if not system_prompt or not system_prompt.strip():
        raise ValueError(
            "System prompt is required."
        )

    if not user_prompt or not user_prompt.strip():
        raise ValueError(
            "User prompt is required."
        )

    try:

        completion = client.chat.completions.create(
            model=MODEL,
            temperature=temperature,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )

    except Exception as exc:

        if _is_rate_limit_error(exc):

            print(
                "Groq rate limit exceeded:",
                exc,
            )

            raise GroqRateLimitError(
                "Groq API rate limit exceeded. Please try again later."
            ) from exc

        print(
            "Groq text generation failed:",
            exc,
        )

        raise Exception(
            "Unable to generate text using Groq."
        ) from exc

    content = (
        completion
        .choices[0]
        .message
        .content
    )

    if not content:
        raise Exception(
            "Groq returned an empty response."
        )

    return content.strip()


# ============================================================
# MULTI-AGENT STORY GENERATION
# ============================================================

def generate_story(
    feature_name: str,
    module: str,
    priority: str,
    story_type: str,
    description: str,
    image_bytes: bytes | None = None,
    image_content_type: str | None = None,
) -> dict[str, Any]:
    """
    Main StoryPilot AI generation entry point.

    The API layer should call this function.

    The actual multi-agent orchestration is delegated to
    app.agents.orchestrator.

    Groq remains the underlying LLM provider.
    """

    # ========================================================
    # INPUT VALIDATION
    # ========================================================

    if not feature_name or not feature_name.strip():
        raise ValueError(
            "Feature name is required."
        )

    if not module or not module.strip():
        raise ValueError(
            "Module is required."
        )

    if not priority or not priority.strip():
        raise ValueError(
            "Priority is required."
        )

    if not story_type or not story_type.strip():
        raise ValueError(
            "Story type is required."
        )

    if not description or not description.strip():
        raise ValueError(
            "Requirement description is required."
        )

    # ========================================================
    # IMPORT ORCHESTRATOR
    # ========================================================
    #
    # Imported inside the function intentionally.
    #
    # This prevents circular-import problems because the
    # agents themselves use the Groq helper functions above.
    #
    # ========================================================

    from app.agents.orchestrator import (
        generate_complete_story,
    )

    # ========================================================
    # EXECUTE MULTI-AGENT WORKFLOW
    # ========================================================

    try:

        generated_story = generate_complete_story(
            feature_name=feature_name.strip(),
            module=module.strip(),
            priority=priority.strip(),
            story_type=story_type.strip(),
            description=description.strip(),
            image_bytes=image_bytes,
            image_content_type=image_content_type,
        )

    except GroqRateLimitError as exc:

        print(
            "Story generation failed: Groq rate limit exceeded"
        )

        raise GroqRateLimitError(
            "Groq API rate limit exceeded. Please try again in a few minutes."
        ) from exc

    # ========================================================
    # VALIDATE ORCHESTRATOR RESULT
    # ========================================================

    if not generated_story:

        raise ValueError(
            "Multi-agent orchestrator returned an empty response."
        )

    if not isinstance(
        generated_story,
        dict,
    ):

        raise ValueError(
            "Multi-agent orchestrator returned an invalid response."
        )

    # ========================================================
    # REQUIRED FIELDS
    # ========================================================

    generated_story.setdefault(
        "feature_name",
        feature_name,
    )

    generated_story.setdefault(
        "module",
        module,
    )

    generated_story.setdefault(
        "priority",
        priority,
    )

    generated_story.setdefault(
        "story_type",
        story_type,
    )

    generated_story.setdefault(
        "title",
        feature_name,
    )

    generated_story.setdefault(
        "user_role",
        "",
    )

    generated_story.setdefault(
        "business_value",
        "",
    )

    generated_story.setdefault(
        "user_story",
        "",
    )

    generated_story.setdefault(
        "product_outcome",
        "",
    )

    generated_story.setdefault(
        "acceptance_criteria",
        [],
    )

    generated_story.setdefault(
        "definition_of_done",
        [],
    )

    # ========================================================
    # 10/10 STORY FIELDS
    # ========================================================

    generated_story.setdefault(
        "assumptions",
        [],
    )

    generated_story.setdefault(
        "dependencies",
        [],
    )

    generated_story.setdefault(
        "test_scenarios",
        [],
    )

    generated_story.setdefault(
        "technical_analysis",
        {},
    )

    generated_story.setdefault(
        "risks",
        [],
    )

    generated_story.setdefault(
        "overall_risk_level",
        "Medium",
    )

    generated_story.setdefault(
        "risk_summary",
        "",
    )

    generated_story.setdefault(
        "story_points",
        5,
    )

    generated_story.setdefault(
        "story_point_reason",
        "",
    )

    generated_story.setdefault(
        "complexity",
        "Medium",
    )

    generated_story.setdefault(
        "estimation_factors",
        [],
    )

    generated_story.setdefault(
        "should_split",
        False,
    )

    generated_story.setdefault(
        "split_reason",
        "",
    )

    # ========================================================
    # BUSINESS ANALYST FIELDS
    # ========================================================

    generated_story.setdefault(
        "requirement_summary",
        "",
    )

    generated_story.setdefault(
        "requirement_quality",
        "Good",
    )

    generated_story.setdefault(
        "business_rules",
        [],
    )

    generated_story.setdefault(
        "preconditions",
        [],
    )

    generated_story.setdefault(
        "edge_cases",
        [],
    )

    generated_story.setdefault(
        "clarification_questions",
        [],
    )

    # ========================================================
    # REVIEW FIELDS
    # ========================================================

    generated_story.setdefault(
        "quality_review",
        {},
    )

    generated_story.setdefault(
        "quality_score",
        0,
    )

    generated_story.setdefault(
        "review_status",
        "NEEDS_REVIEW",
    )

    generated_story.setdefault(
        "review_summary",
        "",
    )

    generated_story.setdefault(
        "missing_acceptance_criteria",
        [],
    )

    generated_story.setdefault(
        "uncovered_acceptance_criteria",
        [],
    )

    generated_story.setdefault(
        "recommendations",
        [],
    )

    generated_story.setdefault(
        "approved_for_final_output",
        False,
    )

    generated_story.setdefault(
        "traceability",
        {},
    )

    # ========================================================
    # NORMALIZE LIST FIELDS
    # ========================================================

    list_fields = [
        "acceptance_criteria",
        "definition_of_done",
        "assumptions",
        "dependencies",
        "test_scenarios",
        "risks",
        "estimation_factors",
        "business_rules",
        "preconditions",
        "edge_cases",
        "clarification_questions",
        "missing_acceptance_criteria",
        "uncovered_acceptance_criteria",
        "recommendations",
    ]

    for field in list_fields:

        if not isinstance(
            generated_story.get(field),
            list,
        ):

            generated_story[field] = []

    # ========================================================
    # NORMALIZE TECHNICAL ANALYSIS
    # ========================================================

    if not isinstance(
        generated_story.get(
            "technical_analysis"
        ),
        dict,
    ):

        generated_story[
            "technical_analysis"
        ] = {}

    # ========================================================
    # NORMALIZE QUALITY REVIEW
    # ========================================================

    if not isinstance(
        generated_story.get(
            "quality_review"
        ),
        dict,
    ):

        generated_story[
            "quality_review"
        ] = {}

    # ========================================================
    # VALID STORY POINTS
    # ========================================================

    valid_story_points = {
        1,
        2,
        3,
        5,
        8,
        13,
    }

    story_points = generated_story.get(
        "story_points"
    )

    if story_points not in valid_story_points:

        generated_story[
            "story_points"
        ] = 5

    # ========================================================
    # VALID RISK LEVEL
    # ========================================================

    valid_risk_levels = {
        "Low",
        "Medium",
        "High",
        "Critical",
    }

    if (
        generated_story.get(
            "overall_risk_level"
        )
        not in valid_risk_levels
    ):

        generated_story[
            "overall_risk_level"
        ] = "Medium"

    # ========================================================
    # QUALITY SCORE
    # ========================================================

    quality_score = generated_story.get(
        "quality_score",
        0,
    )

    try:

        quality_score = float(
            quality_score
        )

    except (
        TypeError,
        ValueError,
    ):

        quality_score = 0

    quality_score = max(
        0,
        min(
            quality_score,
            100,
        ),
    )

    generated_story[
        "quality_score"
    ] = quality_score

    # ========================================================
    # APPROVAL
    # ========================================================

    generated_story[
        "approved_for_final_output"
    ] = bool(
        generated_story.get(
            "approved_for_final_output",
            False,
        )
    )

    # ========================================================
    # RETURN FINAL STORY
    # ========================================================

    return generated_story
