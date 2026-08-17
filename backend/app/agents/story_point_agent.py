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
# the timeout so the Story Point Agent does not fail with
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
# ALLOWED STORY POINTS
# ============================================================

ALLOWED_STORY_POINTS = [
    1,
    2,
    3,
    5,
    8,
    13,
]


# ============================================================
# ALLOWED COMPLEXITY LEVELS
# ============================================================

ALLOWED_COMPLEXITY = [
    "Low",
    "Medium",
    "High",
    "Very High",
]


# ============================================================
# ALLOWED RISK LEVELS
# ============================================================

ALLOWED_RISK_LEVELS = [
    "Low",
    "Medium",
    "High",
    "Very High",
]


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are the Story Point Estimation Agent of StoryPilot AI.

You are an expert:

- Senior Product Manager
- Agile Product Owner
- Scrum Master
- Technical Business Analyst
- Software Estimation Specialist

Your responsibility is to estimate the implementation
complexity of a complete Agile user story.

You receive information from other StoryPilot AI agents,
including:

- Generated user story
- Business value
- Acceptance criteria
- Assumptions
- Dependencies
- Definition of Done
- QA test scenarios
- Risks

Your job is ONLY to estimate story points and explain the
reasoning behind the estimate.

============================================================
STORY POINT SCALE
============================================================

Use ONLY these Fibonacci values:

1
2
3
5
8
13

Never return any other value.

============================================================
ESTIMATION FACTORS
============================================================

Consider all applicable factors:

1. Functional complexity
2. Technical complexity
3. UI complexity
4. Backend complexity
5. Database complexity
6. API complexity
7. Integration complexity
8. Business-rule complexity
9. Validation complexity
10. Security requirements
11. Authorization requirements
12. QA complexity
13. Number of workflows
14. Dependencies
15. Risks
16. Uncertainty
17. Error-handling requirements
18. Data-processing complexity

Do not estimate only from the number of acceptance criteria.

============================================================
STORY POINT GUIDELINES
============================================================

1 POINT

Use for a very small and straightforward change.

Examples:

- Text change
- Simple configuration
- Minor UI adjustment
- Very small isolated change

============================================================

2 POINTS

Use for a small implementation with limited complexity.

Examples:

- Simple UI field
- Small validation
- Minor backend modification
- Small isolated workflow

============================================================

3 POINTS

Use for a small-to-medium implementation.

Examples:

- One straightforward workflow
- Limited UI and backend changes
- Basic validation
- Limited testing effort

============================================================

5 POINTS

Use for a moderate implementation.

Examples:

- Multiple UI fields
- Backend business logic
- Database interaction
- Several validation scenarios
- Moderate QA coverage

============================================================

8 POINTS

Use for a complex implementation.

Examples:

- Multiple workflows
- UI + backend + database
- Security or authorization
- Duplicate detection
- Multiple business rules
- Significant QA coverage
- Multiple components affected
- Several error scenarios

============================================================

13 POINTS

Use for a very complex or highly uncertain implementation.

Examples:

- Multiple external integrations
- Major architectural changes
- Complex business rules
- Significant security implications
- Multiple dependent systems
- Large end-to-end implementation
- High technical uncertainty

============================================================
IMPORTANT ESTIMATION RULES
============================================================

Do NOT automatically choose 8.

Do NOT automatically choose 5.

Choose the story point value based on the actual
implementation complexity.

Do not confuse business importance with technical complexity.

A High-priority story is not automatically an 8 or 13.

A security-related story is not automatically 13.

Estimate the amount of development, testing, validation,
integration, and uncertainty involved.

============================================================
STORY SPLITTING
============================================================

If the story contains multiple independent capabilities
that should reasonably be separate Agile stories:

"should_split": true

Explain why.

Examples:

- Create + edit + delete + reporting may be separate stories.
- Multiple unrelated modules should be separate stories.
- A very large end-to-end feature may need decomposition.

If the story is appropriately scoped:

"should_split": false

============================================================
OUTPUT REQUIREMENT
============================================================

Return ONLY valid JSON.

Use EXACTLY this structure:

{
    "story_points": 8,
    "story_point_reason": "",
    "estimation_factors": [
        ""
    ],
    "complexity": "High",
    "risk_level": "Medium",
    "should_split": false,
    "split_reason": ""
}

============================================================
FIELD REQUIREMENTS
============================================================

story_points:

Must be exactly one of:

1, 2, 3, 5, 8, 13

------------------------------------------------------------

story_point_reason:

Provide a concise but meaningful explanation of why the
selected story point value is appropriate.

------------------------------------------------------------

estimation_factors:

List the major factors that influenced the estimate.

Do not add irrelevant factors.

------------------------------------------------------------

complexity:

Must be exactly one of:

Low
Medium
High
Very High

------------------------------------------------------------

risk_level:

Must be exactly one of:

Low
Medium
High
Very High

------------------------------------------------------------

should_split:

Must be either:

true
false

------------------------------------------------------------

split_reason:

If should_split is true, explain why the story should be split.

If should_split is false, return an empty string.

============================================================
QUALITY RULE
============================================================

The final estimate must be realistic for a professional
software development team.

The reasoning should be understandable to:

- Product Manager
- Product Owner
- Developer
- QA Engineer
- Scrum Master

Return ONLY JSON.
"""


# ============================================================
# PROMPT BUILDER
# ============================================================

def _build_prompt(
    story_output: dict,
    business_analyst_output: dict,
    qa_output: dict,
    risk_output: dict | None = None,
) -> str:

    story_json = json.dumps(
        story_output,
        indent=2,
        ensure_ascii=False,
    )

    business_analyst_json = json.dumps(
        business_analyst_output,
        indent=2,
        ensure_ascii=False,
    )

    qa_json = json.dumps(
        qa_output,
        indent=2,
        ensure_ascii=False,
    )

    risk_json = json.dumps(
        risk_output or {},
        indent=2,
        ensure_ascii=False,
    )

    return f"""
Estimate the story points for the following Agile user story.

============================================================
USER STORY AGENT OUTPUT
============================================================

{story_json}

============================================================
BUSINESS ANALYST AGENT OUTPUT
============================================================

{business_analyst_json}

============================================================
QA AGENT OUTPUT
============================================================

{qa_json}

============================================================
RISK AGENT OUTPUT
============================================================

{risk_json}

============================================================
ESTIMATION TASK
============================================================

Analyze the complete information.

Consider:

- Functional complexity
- Technical complexity
- UI complexity
- Backend complexity
- Database complexity
- API complexity
- Integration complexity
- Business rules
- Validation
- Security
- Authorization
- QA effort
- Dependencies
- Risks
- Error handling
- Uncertainty

Select exactly one Fibonacci story point value:

1, 2, 3, 5, 8, or 13.

Provide a clear explanation.

Also determine whether the story should be split into
smaller Agile stories.

Return ONLY valid JSON.
"""


# ============================================================
# JSON VALIDATION HELPER
# ============================================================

def _validate_result(
    result: dict,
) -> dict:

    if not isinstance(
        result,
        dict,
    ):
        raise ValueError(
            "Story Point Agent returned an invalid object."
        )

    # --------------------------------------------------------
    # STORY POINTS
    # --------------------------------------------------------

    story_points = result.get(
        "story_points",
        5,
    )

    try:
        story_points = int(
            story_points
        )

    except (
        TypeError,
        ValueError,
    ):
        story_points = 5

    if story_points not in ALLOWED_STORY_POINTS:
        story_points = 5

    result["story_points"] = story_points

    # --------------------------------------------------------
    # STORY POINT REASON
    # --------------------------------------------------------

    story_point_reason = result.get(
        "story_point_reason",
        "",
    )

    if not isinstance(
        story_point_reason,
        str,
    ):
        story_point_reason = ""

    result[
        "story_point_reason"
    ] = story_point_reason.strip()

    # --------------------------------------------------------
    # ESTIMATION FACTORS
    # --------------------------------------------------------

    estimation_factors = result.get(
        "estimation_factors",
        [],
    )

    if not isinstance(
        estimation_factors,
        list,
    ):
        estimation_factors = []

    cleaned_factors = []

    for factor in estimation_factors:

        if factor is None:
            continue

        factor_text = str(
            factor
        ).strip()

        if factor_text:
            cleaned_factors.append(
                factor_text
            )

    result[
        "estimation_factors"
    ] = cleaned_factors

    # --------------------------------------------------------
    # COMPLEXITY
    # --------------------------------------------------------

    complexity = result.get(
        "complexity",
        "Medium",
    )

    if complexity not in ALLOWED_COMPLEXITY:
        complexity = "Medium"

    result[
        "complexity"
    ] = complexity

    # --------------------------------------------------------
    # RISK LEVEL
    # --------------------------------------------------------

    risk_level = result.get(
        "risk_level",
        "Medium",
    )

    if risk_level not in ALLOWED_RISK_LEVELS:
        risk_level = "Medium"

    result[
        "risk_level"
    ] = risk_level

    # --------------------------------------------------------
    # SHOULD SPLIT
    # --------------------------------------------------------

    should_split = result.get(
        "should_split",
        False,
    )

    if isinstance(
        should_split,
        str,
    ):
        should_split = (
            should_split.strip().lower()
            == "true"
        )

    elif isinstance(
        should_split,
        int,
    ):
        should_split = bool(
            should_split
        )

    elif not isinstance(
        should_split,
        bool,
    ):
        should_split = False

    result[
        "should_split"
    ] = should_split

    # --------------------------------------------------------
    # SPLIT REASON
    # --------------------------------------------------------

    split_reason = result.get(
        "split_reason",
        "",
    )

    if not isinstance(
        split_reason,
        str,
    ):
        split_reason = ""

    split_reason = split_reason.strip()

    if not should_split:
        split_reason = ""

    result[
        "split_reason"
    ] = split_reason

    return result


# ============================================================
# STORY POINT ESTIMATION
# ============================================================

def estimate_story_points(
    story_output: dict,
    business_analyst_output: dict,
    qa_output: dict,
    risk_output: dict | None = None,
) -> dict:

    if not isinstance(
        story_output,
        dict,
    ):
        raise ValueError(
            "story_output must be a dictionary."
        )

    if not isinstance(
        business_analyst_output,
        dict,
    ):
        raise ValueError(
            "business_analyst_output must be a dictionary."
        )

    if not isinstance(
        qa_output,
        dict,
    ):
        raise ValueError(
            "qa_output must be a dictionary."
        )

    if risk_output is not None and not isinstance(
        risk_output,
        dict,
    ):
        raise ValueError(
            "risk_output must be a dictionary or None."
        )

    prompt = _build_prompt(
        story_output=story_output,
        business_analyst_output=business_analyst_output,
        qa_output=qa_output,
        risk_output=risk_output,
    )

    try:

        completion = client.chat.completions.create(
            model=MODEL,
            temperature=0.1,
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
                    "content": prompt,
                },
            ],
        )

    except Exception as exc:

        if is_rate_limit_error(exc):

            raise GroqRateLimitError(
                "Groq API rate limit exceeded. Please try again in a few minutes."
            ) from exc

        raise Exception(
            f"Story Point Agent failed: {exc}"
        ) from exc

    content = (
        completion
        .choices[0]
        .message
        .content
    )

    if not content:
        raise Exception(
            "Story Point Agent returned an empty response."
        )

    try:

        result = json.loads(
            content
        )

    except json.JSONDecodeError as exc:

        raise Exception(
            "Story Point Agent returned invalid JSON."
        ) from exc

    return _validate_result(
        result
    )
