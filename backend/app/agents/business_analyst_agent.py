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
# the timeout so the Business Analyst Agent does not fail with
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
You are the Business Analyst Agent of StoryPilot AI.

Your responsibility is to take the structured output from the
Product Manager Agent and perform detailed business-analysis
validation and refinement.

You are an expert in:

- Business Analysis
- Requirements Engineering
- Agile
- Scrum
- User Stories
- Acceptance Criteria
- Requirement Traceability
- Functional Requirements
- Non-functional Requirements
- Business Rules
- Edge Cases
- Assumptions
- Dependencies
- Requirement Validation

Your goal is to make the requirement precise, complete,
testable, and unambiguous.

IMPORTANT:

You are NOT the final QA agent.

Do not generate detailed QA test cases.
Do not generate implementation code.
Do not generate technical architecture.
Do not generate risk analysis.
Do not generate story point estimation.
Do not generate quality review.

Do not invent unrelated functionality.

============================================================
ANALYSIS RESPONSIBILITIES
============================================================

Analyze the Product Manager Agent output and identify:

1. Requirement clarity
2. Missing business information
3. Ambiguous requirements
4. Business rules
5. Assumptions
6. Dependencies
7. User roles
8. Preconditions
9. Expected system behavior
10. Validation requirements
11. Error scenarios
12. Boundary conditions
13. Security or authorization requirements
14. Workflow requirements
15. Data requirements

============================================================
ACCEPTANCE CRITERIA
============================================================

Improve the acceptance criteria.

Every acceptance criterion must:

- Have a unique ID.
- Be atomic.
- Be independently testable.
- Be unambiguous.
- Describe observable system behavior.
- Be directly related to the user story.
- Avoid implementation details.

Use EXACTLY this structure:

AC001

Given [precondition]

When [action]

Then [expected result]

Additional business conditions may be included when necessary.

The `given`, `when`, and `then` fields must all be non-empty. Never
return placeholders, empty strings, or a criterion without observable behavior.

============================================================
BUSINESS RULES
============================================================

Extract explicit or reasonably implied business rules.

Examples:

- Only authorized users can perform the action.
- Duplicate configurations are not allowed.
- Mandatory fields must be completed.
- Values must belong to supported options.
- Existing records must remain consistent after updates.

Do not create rules that are unrelated to the requirement.

============================================================
ASSUMPTIONS
============================================================

List assumptions that were necessary because the requirement
did not provide enough information.

Keep assumptions realistic and product-level.

============================================================
DEPENDENCIES
============================================================

Identify dependencies such as:

- Authentication
- Authorization
- Existing services
- Database
- External systems
- Configuration
- Existing APIs
- User permissions

Only include dependencies that are relevant.

============================================================
EDGE CASES
============================================================

Identify business-level edge cases.

Examples:

- Duplicate configuration
- Missing mandatory information
- Invalid values
- Conflicting conditions
- Unauthorized user
- Existing record modified by another operation
- Empty result
- Invalid state transition

Do not turn these into detailed test cases.

============================================================
REQUIREMENT QUALITY
============================================================

Provide a requirement-quality assessment.

Use one of:

- Excellent
- Good
- Needs Clarification

If clarification is required, list the exact questions.

============================================================
TRACEABILITY
============================================================

Maintain traceability between the user story and acceptance
criteria.

Every acceptance criterion must have a unique ID.

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Use EXACTLY this structure:

{
    "requirement_summary": "",
    "requirement_quality": "",
    "user_role": "",
    "business_rules": [
        ""
    ],
    "preconditions": [
        ""
    ],
    "assumptions": [
        ""
    ],
    "dependencies": [
        ""
    ],
    "edge_cases": [
        ""
    ],
    "clarification_questions": [
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
# PROMPT BUILDER
# ============================================================

def _build_prompt(
    product_manager_output: dict,
    feature_name: str,
    module: str,
    description: str,
) -> str:

    product_manager_json = json.dumps(
        product_manager_output,
        indent=2,
        ensure_ascii=False,
    )

    return f"""
Analyze the following product requirement and Product Manager
Agent output.

============================================================
ORIGINAL REQUIREMENT
============================================================

Feature Name:
{feature_name}

Module:
{module}

Requirement Description:
{description}

============================================================
PRODUCT MANAGER OUTPUT
============================================================

{product_manager_json}

============================================================

Perform a detailed Business Analyst review.

Validate:

- Requirement clarity
- Business rules
- Preconditions
- Assumptions
- Dependencies
- Edge cases
- Missing information
- Acceptance criteria
- User role
- Expected business behavior

Improve the acceptance criteria so they are:

- Atomic
- Testable
- Observable
- Unambiguous
- Directly related to the user story

Use Given / When / Then.

Maintain consistency with the original requirement.

Do not generate detailed QA test cases.

Do not generate implementation details.

Do not invent unrelated functionality.

Return only valid JSON using the required structure.
"""


# ============================================================
# BUSINESS ANALYST AGENT
# ============================================================

def analyze_business(
    story_output: dict,
    feature_name: str,
    module: str,
    description: str,
) -> dict:

    if not isinstance(
        story_output,
        dict,
    ):
        raise ValueError(
            "Product Manager output must be a dictionary."
        )

    prompt = _build_prompt(
        product_manager_output=story_output,
        feature_name=feature_name,
        module=module,
        description=description,
    )

    # ========================================================
    # GROQ REQUEST
    # ========================================================

    try:

        completion = client.chat.completions.create(
            model=MODEL,
            temperature=0.15,
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
            f"Business Analyst Agent failed: {exc}"
        ) from exc

    # ========================================================
    # RESPONSE
    # ========================================================

    content = (
        completion
        .choices[0]
        .message
        .content
    )

    if not content:

        raise Exception(
            "Business Analyst Agent returned an empty response."
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
            "Business Analyst Agent returned invalid JSON."
        ) from exc

    if not isinstance(
        result,
        dict,
    ):

        raise Exception(
            "Business Analyst Agent returned an invalid structure."
        )

    # ========================================================
    # ENSURE REQUIRED LIST FIELDS
    # ========================================================

    list_fields = [
        "business_rules",
        "preconditions",
        "assumptions",
        "dependencies",
        "edge_cases",
        "clarification_questions",
        "acceptance_criteria",
    ]

    for field in list_fields:

        if not isinstance(
            result.get(field),
            list,
        ):

            result[field] = []

    # ========================================================
    # VALIDATE ACCEPTANCE CRITERIA
    # ========================================================

    validated_acceptance_criteria = []

    for index, criterion in enumerate(
        result["acceptance_criteria"],
        start=1,
    ):

        if not isinstance(
            criterion,
            dict,
        ):

            continue

        criterion_id = criterion.get(
            "id"
        )

        if not criterion_id:

            criterion_id = (
                f"AC{index:03d}"
            )

        given = str(criterion.get("given", "")).strip()
        when = str(criterion.get("when", "")).strip()
        then = str(criterion.get("then", "")).strip()

        # Ignore incomplete LLM output instead of propagating blank AC cards.
        if not (given and when and then):
            continue

        validated_acceptance_criteria.append(
            {
                "id": criterion_id,
                "given": given,
                "when": when,
                "then": then,
            }
        )

    result[
        "acceptance_criteria"
    ] = validated_acceptance_criteria

    # ========================================================
    # REQUIREMENT QUALITY
    # ========================================================

    valid_quality_values = {
        "Excellent",
        "Good",
        "Needs Clarification",
    }

    requirement_quality = result.get(
        "requirement_quality",
        "Good",
    )

    if requirement_quality not in valid_quality_values:

        requirement_quality = "Good"

    result[
        "requirement_quality"
    ] = requirement_quality

    # ========================================================
    # REQUIREMENT SUMMARY
    # ========================================================

    if not result.get(
        "requirement_summary"
    ):

        result[
            "requirement_summary"
        ] = (
            f"Business analysis completed for "
            f"{feature_name} in the {module} module."
        )

    # ========================================================
    # USER ROLE
    # ========================================================

    if not result.get(
        "user_role"
    ):

        result[
            "user_role"
        ] = story_output.get(
            "user_role",
            "",
        )

    # ========================================================
    # RETURN
    # ========================================================

    return result


# ============================================================
# BACKWARD COMPATIBILITY
# ============================================================

def analyze_business_requirement(
    product_manager_output: dict,
) -> dict:

    return analyze_business(
        story_output=product_manager_output,
        feature_name=product_manager_output.get(
            "title",
            "",
        ),
        module=product_manager_output.get(
            "module",
            "",
        ),
        description=product_manager_output.get(
            "user_story",
            "",
        ),
    )
