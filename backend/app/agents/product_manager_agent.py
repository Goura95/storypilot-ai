import base64
import json

import httpx
from groq import Groq

from app.config import GROQ_API_KEY, GROQ_STORY_MODEL
from app.services.groq_service import (
    GroqRateLimitError,
    is_rate_limit_error,
)


# ============================================================
# GROQ CLIENT
# ============================================================
#
# The Groq SDK default read timeout is 60 seconds. The multi-agent
# pipeline performs several sequential LLM calls, and a single call
# can legitimately take longer than 60 seconds under load. Increase
# the timeout so the Product Manager Agent does not fail with
# "Request timed out" while Groq is still processing.
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
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are the Product Manager Agent of StoryPilot AI.

Your responsibility is to analyze a product requirement and produce
a high-quality Agile user story from a Product Management perspective.

You are an expert in:

- Product Management
- Agile
- Scrum
- Azure DevOps
- Product requirements
- User personas
- Business value
- Feature definition
- Product outcomes

You must focus ONLY on the product-management aspects of the requirement.

Do not generate QA test cases.
Do not generate implementation code.
Do not generate technical architecture.
Do not generate risk analysis.
Do not generate story point estimation.
Do not generate quality review.

Do not invent unrelated functionality.

The Product Manager Agent must identify:

1. Feature title
2. Module
3. User role
4. User capability
5. Business value
6. Product outcome
7. Story type
8. Priority
9. Assumptions
10. Dependencies
11. Initial acceptance criteria

============================================================
USER STORY FORMAT
============================================================

The user story MUST follow this format:

As a [specific user/role],
I want [specific capability],
So that [specific business value].

The user story must describe ONE clear user outcome.

============================================================
ACCEPTANCE CRITERIA
============================================================

Acceptance criteria must:

- Have unique IDs.
- Be atomic.
- Be independently testable.
- Be unambiguous.
- Be directly related to the user story.
- Cover the important behavior described in the requirement.

Use:

Given [precondition]
When [action]
Then [expected outcome]

Do not generate generic acceptance criteria.

============================================================
PRIORITY
============================================================

Use one of:

- Critical
- High
- Medium
- Low

Use the requested priority when it is reasonable.

============================================================
STORY TYPE
============================================================

Use an appropriate value such as:

- Feature
- Enhancement
- Bug
- Improvement

Use the requested story type when it is reasonable.

============================================================
ASSUMPTIONS
============================================================

Only create reasonable product-level assumptions when information
is missing from the requirement.

Do not invent implementation details.

============================================================
DEPENDENCIES
============================================================

Identify only dependencies that are reasonably implied by the
requirement.

============================================================
IMAGE HANDLING
============================================================

If an image is provided, the image may contain useful product
requirements, UI information, labels, fields, or workflow information.

However, this text-generation model cannot directly interpret image
pixels.

Do not invent information from an image.

Use only information explicitly available in the text requirement.

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Use EXACTLY this structure:

{
    "title": "",
    "module": "",
    "story_type": "",
    "priority": "",
    "user_role": "",
    "business_value": "",
    "user_story": "",
    "product_outcome": "",
    "assumptions": [
        ""
    ],
    "dependencies": [
        ""
    ],
    "acceptance_criteria": [
        {
            "id": "AC001",
            "given": "",
            "when": "",
            "then": ""
        }
    ]
}

Do not put markdown inside the JSON.
"""


# ============================================================
# BUILD TEXT PROMPT
# ============================================================

def _build_prompt(
    feature_name: str,
    module: str,
    priority: str,
    story_type: str,
    description: str,
) -> str:

    return f"""
Analyze the following product requirement.

Feature Name:
{feature_name}

Module:
{module}

Requested Priority:
{priority}

Requested Story Type:
{story_type}

Requirement Description:
{description}

Create a professional Azure DevOps-ready user story.

Focus ONLY on Product Management.

Ensure the output contains:

- A specific user role
- One clear user outcome
- A meaningful business value
- A measurable or clear product outcome
- Reasonable assumptions
- Relevant dependencies
- Atomic Given/When/Then acceptance criteria

Every acceptance criterion MUST contain non-empty `given`, `when`,
and `then` values. Do not return placeholder or blank strings.

The acceptance criteria must directly trace back to the requirement.

Do not generate:

- QA test cases
- Technical architecture
- Implementation details
- Risk analysis
- Story points
- Quality review

Return only valid JSON.
"""


# ============================================================
# IMAGE DATA URI
# ============================================================

def _encode_image(
    image_bytes: bytes,
    content_type: str,
) -> str:

    encoded_image = base64.b64encode(
        image_bytes
    ).decode("utf-8")

    return (
        f"data:{content_type};base64,{encoded_image}"
    )


# ============================================================
# PRODUCT MANAGER AGENT
# ============================================================

def generate_user_story(
    feature_name: str,
    module: str,
    priority: str,
    story_type: str,
    description: str,
    image_bytes: bytes | None = None,
    image_content_type: str | None = None,
) -> dict:

    prompt = _build_prompt(
        feature_name=feature_name,
        module=module,
        priority=priority,
        story_type=story_type,
        description=description,
    )

    # ========================================================
    # USER CONTENT
    # ========================================================

    user_content = [
        {
            "type": "text",
            "text": prompt,
        }
    ]

    # ========================================================
    # IMAGE INFORMATION
    # ========================================================
    #
    # llama-3.3-70b-versatile is a text-generation model.
    # It cannot reliably analyze image pixels.
    #
    # We therefore explicitly inform the model that an image
    # exists without asking it to invent information from it.
    #
    # The image parameters are accepted here so the orchestrator
    # can pass uploaded images without causing an argument error.
    #
    # ========================================================

    if image_bytes and image_content_type:

        user_content.append(
            {
                "type": "text",
                "text": (
                    "An image was uploaded with this requirement. "
                    "The current Product Manager Agent uses a "
                    "text-generation model and cannot directly "
                    "analyze image pixels. Do not invent any "
                    "information from the image."
                ),
            }
        )

    # ========================================================
    # GROQ REQUEST
    # ========================================================

    try:

        completion = client.chat.completions.create(
            model=MODEL,
            temperature=0.2,
            response_format={
                "type": "json_object"
            },
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": user_content,
                },
            ],
        )

    except Exception as exc:

        if is_rate_limit_error(exc):

            raise GroqRateLimitError(
                "Groq API rate limit exceeded. Please try again in a few minutes."
            ) from exc

        raise Exception(
            f"Product Manager Agent failed: {exc}"
        ) from exc

    # ========================================================
    # RESPONSE
    # ========================================================

    content = completion.choices[0].message.content

    if not content:

        raise Exception(
            "Product Manager Agent returned an empty response."
        )

    # ========================================================
    # JSON PARSING
    # ========================================================

    try:

        result = json.loads(
            content
        )

    except json.JSONDecodeError as exc:

        raise Exception(
            "Product Manager Agent returned invalid JSON."
        ) from exc

    # ========================================================
    # BASIC VALIDATION
    # ========================================================

    required_fields = [
        "title",
        "module",
        "story_type",
        "priority",
        "user_role",
        "business_value",
        "user_story",
        "product_outcome",
        "assumptions",
        "dependencies",
        "acceptance_criteria",
    ]

    missing_fields = [
        field
        for field in required_fields
        if field not in result
    ]

    if missing_fields:

        raise Exception(
            "Product Manager Agent response is missing "
            f"required fields: {missing_fields}"
        )

    # ========================================================
    # ACCEPTANCE CRITERIA VALIDATION
    # ========================================================

    acceptance_criteria = result.get(
        "acceptance_criteria",
        [],
    )

    if not isinstance(
        acceptance_criteria,
        list,
    ):

        raise Exception(
            "Product Manager Agent returned invalid "
            "acceptance_criteria format."
        )

    validated_acceptance_criteria = []

    for index, criterion in enumerate(
        acceptance_criteria,
        start=1,
    ):

        if not isinstance(
            criterion,
            dict,
        ):

            raise Exception(
                "Acceptance criterion must be an object."
            )

        given = str(criterion.get("given", "")).strip()
        when = str(criterion.get("when", "")).strip()
        then = str(criterion.get("then", "")).strip()

        # Drop model placeholders. The Business Analyst agent will refine the
        # remaining criteria, and the API has a final safe fallback if needed.
        if not (given and when and then):
            continue

        validated_acceptance_criteria.append(
            {
                "id": str(criterion.get("id") or f"AC{index:03d}"),
                "given": given,
                "when": when,
                "then": then,
            }
        )

    result["acceptance_criteria"] = validated_acceptance_criteria

    # ========================================================
    # RETURN
    # ========================================================

    return result


# ============================================================
# BACKWARD COMPATIBILITY
# ============================================================
#
# Existing code may still use the previous function name.
#
# Keep this wrapper so both names work.
#
# ============================================================

def generate_product_manager_analysis(
    feature_name: str,
    module: str,
    priority: str,
    story_type: str,
    description: str,
) -> dict:

    return generate_user_story(
        feature_name=feature_name,
        module=module,
        priority=priority,
        story_type=story_type,
        description=description,
    )
