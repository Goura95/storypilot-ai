import json

import httpx
from groq import Groq
from pydantic import ValidationError

from app.config import GROQ_API_KEY
from app.schemas.requirement import RequirementAnalysis


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

MODEL = "llama-3.3-70b-versatile"


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are the Requirement Analysis Engine of StoryPilot AI.

Your job is to analyze a raw product requirement before
another AI component generates the final user story.

You are an expert:

- Senior Product Manager
- Business Analyst
- QA Engineer
- Agile Product Owner
- Software Requirements Analyst

Your analysis must be practical and directly based on the
provided requirement.

Do NOT generate the final user story.

Do NOT generate acceptance criteria.

Do NOT generate final QA test cases.

Your job is ONLY to understand and structure the requirement.

============================================================
ANALYSIS OBJECTIVES
============================================================

Identify:

1. Feature
2. Module
3. Requirement summary
4. Actors
5. User goal
6. Functional requirements
7. Validation rules
8. Security requirements
9. Workflow
10. QA coverage areas
11. Reasonable assumptions

============================================================
ACTORS
============================================================

Identify the users, roles, systems, or services involved.

Examples:

- Administrator
- End User
- Manager
- System
- API
- Authentication Service

For every actor provide:

- name
- responsibility

Do not invent actors that are unrelated to the requirement.

============================================================
FUNCTIONAL REQUIREMENTS
============================================================

Extract actual capabilities from the requirement.

Each functional requirement must describe something
the system must do.

Examples:

- Administrator can create an MFA rule.
- User can select a device type.
- System validates required fields.
- System saves the configured rule.

Do not write generic functionality.

Every functional requirement must have a priority.

Use:

- Critical
- High
- Medium
- Low

============================================================
VALIDATION RULES
============================================================

Identify explicit or reasonably implied validation behavior.

Examples:

- Required fields cannot be empty.
- Invalid values must be rejected.
- Duplicate rules must not be created.

If the requirement does not contain a validation rule,
do not invent complex validation.

============================================================
SECURITY REQUIREMENTS
============================================================

Identify security and authorization requirements.

Consider:

- Authentication
- Authorization
- Role-based access
- Permissions
- Unauthorized access
- Data protection
- Sensitive information

Only include security requirements that are applicable.

============================================================
WORKFLOW
============================================================

Convert the requirement into a logical sequence.

Example:

1. Administrator opens rule management.
2. Administrator selects Add Rule.
3. Administrator configures the rule.
4. System validates the configuration.
5. System saves the rule.

Every workflow step must contain:

- step
- action
- expected_result

============================================================
QA AREAS
============================================================

Identify QA areas that should be tested.

Possible areas:

- Positive testing
- Negative testing
- Validation
- Boundary testing
- UI testing
- Workflow testing
- Authorization
- Security
- Error handling
- Integration
- Data persistence
- Regression

For every QA area explain WHY it applies.

Do not automatically include every possible category.

============================================================
ASSUMPTIONS
============================================================

If information is missing but a reasonable product-level
assumption is required, document it.

Do not invent unrelated functionality.

Keep assumptions minimal.

============================================================
IMPORTANT RULE
============================================================

The analysis must remain faithful to the original
requirement.

Do not add functionality merely because it is common
in similar products.

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Do not return:

- Markdown
- Code fences
- Explanations
- Comments
- Additional fields

Use EXACTLY this structure:

{
    "feature_name": "",
    "module": "",
    "summary": "",
    "actors": [
        {
            "name": "",
            "responsibility": ""
        }
    ],
    "goal": "",
    "functional_requirements": [
        {
            "requirement": "",
            "priority": "High"
        }
    ],
    "validation_rules": [
        {
            "rule": "",
            "expected_behavior": ""
        }
    ],
    "security_requirements": [
        {
            "requirement": "",
            "expected_behavior": ""
        }
    ],
    "workflow": [
        {
            "step": 1,
            "action": "",
            "expected_result": ""
        }
    ],
    "qa_areas": [
        {
            "area": "",
            "reason": ""
        }
    ],
    "assumptions": [
        {
            "assumption": "",
            "impact": ""
        }
    ]
}
"""


# ============================================================
# BUILD PROMPT
# ============================================================

def _build_analysis_prompt(
    feature_name: str,
    module: str,
    priority: str,
    story_type: str,
    description: str,
) -> str:

    return f"""
Analyze the following product requirement.

============================================================
INPUT
============================================================

Feature Name:
{feature_name}

Module:
{module}

Requested Priority:
{priority}

Story Type:
{story_type}

Requirement Description:
{description}

============================================================
TASK
============================================================

Understand the requirement and produce a structured
requirement analysis.

Identify the actual actors, goal, functional requirements,
validation rules, applicable security requirements,
workflow, QA areas, and reasonable assumptions.

The analysis will be consumed by another AI component
that will generate the final user story and test cases.

Therefore:

- Be precise.
- Be specific.
- Do not write generic statements.
- Do not invent unrelated functionality.
- Keep all analysis consistent with the requirement.

Return ONLY valid JSON.
"""


# ============================================================
# VALIDATE ANALYSIS
# ============================================================

def _validate_analysis(
    data: dict,
) -> dict:

    try:

        validated = RequirementAnalysis.model_validate(
            data
        )

    except ValidationError as exc:

        print(
            "Requirement analysis validation failed:"
        )

        print(exc)

        raise ValueError(
            "AI generated an invalid requirement analysis."
        ) from exc

    return validated.model_dump()


# ============================================================
# ANALYZE REQUIREMENT
# ============================================================

def analyze_requirement(
    feature_name: str,
    module: str,
    priority: str,
    story_type: str,
    description: str,
) -> dict:

    # ========================================================
    # BUILD PROMPT
    # ========================================================

    prompt = _build_analysis_prompt(
        feature_name=feature_name,
        module=module,
        priority=priority,
        story_type=story_type,
        description=description,
    )

    # ========================================================
    # CALL GROQ
    # ========================================================

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

        print(
            "Groq requirement analysis error:",
            exc,
        )

        raise RuntimeError(
            "Unable to analyze the requirement."
        ) from exc

    # ========================================================
    # EXTRACT RESPONSE
    # ========================================================

    try:

        content = (
            completion
            .choices[0]
            .message
            .content
        )

    except (
        AttributeError,
        IndexError,
        TypeError,
    ) as exc:

        raise RuntimeError(
            "Groq returned an unexpected response."
        ) from exc

    # ========================================================
    # EMPTY RESPONSE
    # ========================================================

    if not content:

        raise RuntimeError(
            "Groq returned an empty requirement analysis."
        )

    # ========================================================
    # PARSE JSON
    # ========================================================

    try:

        analysis = json.loads(
            content
        )

    except json.JSONDecodeError as exc:

        print(
            "Invalid requirement analysis JSON:"
        )

        print(content)

        raise RuntimeError(
            "Groq returned invalid requirement analysis JSON."
        ) from exc

    # ========================================================
    # ENSURE AI DID NOT RETURN SOMETHING OTHER THAN OBJECT
    # ========================================================

    if not isinstance(
        analysis,
        dict,
    ):

        raise RuntimeError(
            "Requirement analysis must be a JSON object."
        )

    # ========================================================
    # APPLICATION-CONTROLLED VALUES
    # ========================================================
    #
    # The user supplied these values.
    # The AI should not override them.
    #
    # ========================================================

    analysis["feature_name"] = feature_name

    analysis["module"] = module

    # ========================================================
    # VALIDATE WITH PYDANTIC
    # ========================================================

    return _validate_analysis(
        analysis
    )