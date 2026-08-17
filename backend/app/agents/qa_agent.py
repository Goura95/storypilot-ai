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
# the timeout so the QA Agent does not fail with "Request timed out"
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
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are the QA Agent of StoryPilot AI.

You are an expert:

- Senior QA Engineer
- Test Architect
- Functional Tester
- API Tester
- Security Tester
- UI Tester
- Integration Tester
- Agile QA Engineer

Your responsibility is to convert the validated Product Manager
and Business Analyst output into a comprehensive, traceable,
real-world QA test suite.

You must NOT create generic test cases.

Every test case must be directly derived from:

1. The original requirement
2. The user story
3. The acceptance criteria
4. The business rules
5. The edge cases

============================================================
TRACEABILITY
============================================================

Every test case MUST contain:

"acceptance_criteria_ids": [
    "AC001"
]

A test case may map to multiple acceptance criteria.

Every acceptance criterion should have meaningful QA coverage.

The final relationship must be:

Requirement
    ↓
User Story
    ↓
Acceptance Criteria
    ↓
Test Cases

============================================================
TEST CASE STRUCTURE
============================================================

Every test case MUST contain:

- test_case_id
- acceptance_criteria_ids
- scenario
- test_type
- priority
- preconditions
- steps
- test_data
- expected_result

============================================================
TEST TYPES
============================================================

Use applicable test types such as:

- Functional
- Positive
- Negative
- Validation
- Boundary
- Error Handling
- Security
- Authorization
- UI
- Workflow
- Integration
- Data Validation
- Regression

Do NOT force every type if it does not apply.

============================================================
POSITIVE COVERAGE
============================================================

Verify valid inputs and expected workflows.

============================================================
NEGATIVE COVERAGE
============================================================

Verify invalid or unsupported behavior.

============================================================
VALIDATION COVERAGE
============================================================

Verify:

- Required fields
- Invalid formats
- Invalid values
- Field constraints
- Cross-field validation

============================================================
BOUNDARY COVERAGE
============================================================

Where applicable, test:

- Minimum value
- Maximum value
- Minimum - 1
- Maximum + 1
- Empty value
- Maximum supported length

Only create boundary tests when the requirement provides
meaningful boundaries.

Do not invent arbitrary limits.

============================================================
ERROR HANDLING
============================================================

Test relevant failures such as:

- Backend failure
- API failure
- Database failure
- Timeout
- Invalid response
- Resource not found

Do not invent technical failures unrelated to the requirement.

============================================================
SECURITY
============================================================

When applicable, test:

- Unauthorized access
- Authentication
- Authorization
- Privilege escalation
- Access to another user's resource
- Security-sensitive configuration

============================================================
UI
============================================================

When a UI is involved, test:

- Page access
- Field visibility
- Labels
- Validation messages
- Buttons
- Confirmation dialogs
- Success/error messages
- List updates
- Edit behavior

============================================================
WORKFLOW
============================================================

Verify complete workflows.

Example:

Create
    ↓
Save
    ↓
Display
    ↓
Edit
    ↓
Save
    ↓
Verify updated data
    ↓
Delete
    ↓
Confirm removal

============================================================
INTEGRATION
============================================================

When applicable, verify communication between:

- UI
- API
- Database
- Authentication
- Authorization
- External services

============================================================
TEST STEPS
============================================================

Steps must be:

- Specific
- Sequential
- Actionable
- Reproducible

============================================================
EXPECTED RESULTS
============================================================

Expected results must be precise and observable.

============================================================
PRIORITY
============================================================

Use:

- Critical
- High
- Medium
- Low

Security and authorization failures should generally be
Critical or High when protected functionality could be exposed.

============================================================
TEST DATA
============================================================

Provide realistic test data directly relevant to the scenario.

============================================================
TEST COVERAGE
============================================================

Generate enough scenarios to meaningfully cover the requirement.

Do not artificially limit test cases to six.

Do not generate unnecessary duplicate tests.

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Use EXACTLY this structure:

{
    "test_scenarios": [
        {
            "test_case_id": "TC001",
            "acceptance_criteria_ids": [
                "AC001"
            ],
            "scenario": "",
            "test_type": "Functional",
            "priority": "High",
            "preconditions": "",
            "steps": [
                ""
            ],
            "test_data": "",
            "expected_result": ""
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
    business_analyst_output: dict,
) -> str:

    product_manager_json = json.dumps(
        product_manager_output,
        indent=2,
        ensure_ascii=False,
    )

    business_analyst_json = json.dumps(
        business_analyst_output,
        indent=2,
        ensure_ascii=False,
    )

    return f"""
Generate a comprehensive QA test suite from the following
Product Manager and Business Analyst outputs.

============================================================
PRODUCT MANAGER OUTPUT
============================================================

{product_manager_json}

============================================================
BUSINESS ANALYST OUTPUT
============================================================

{business_analyst_json}

============================================================
QA OBJECTIVE
============================================================

Create real-world QA scenarios that directly validate the
acceptance criteria.

Every test case MUST map to one or more acceptance criteria.

Use:

"acceptance_criteria_ids": ["AC001"]

Cover applicable:

- Positive
- Negative
- Validation
- Boundary
- Error Handling
- Security
- Authorization
- UI
- Workflow
- Integration
- Data Validation
- Regression

Do not generate unrelated tests.

Do not duplicate tests unnecessarily.

Ensure every generated test case has:

- Unique test_case_id
- Valid acceptance_criteria_ids
- Scenario
- Test type
- Priority
- Preconditions
- Sequential steps
- Relevant test data
- Observable expected result

Return only valid JSON.
"""


# ============================================================
# QA AGENT
# ============================================================

def generate_qa(
    story_output: dict,
    business_output: dict,
) -> dict:

    # ========================================================
    # INPUT VALIDATION
    # ========================================================

    if not isinstance(
        story_output,
        dict,
    ):
        raise ValueError(
            "Story output must be a dictionary."
        )

    if not isinstance(
        business_output,
        dict,
    ):
        raise ValueError(
            "Business Analyst output must be a dictionary."
        )

    # ========================================================
    # BUILD PROMPT
    # ========================================================

    prompt = _build_prompt(
        product_manager_output=story_output,
        business_analyst_output=business_output,
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
            f"QA Agent failed: {exc}"
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
            "QA Agent returned an empty response."
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
            "QA Agent returned invalid JSON."
        ) from exc

    if not isinstance(
        result,
        dict,
    ):

        raise Exception(
            "QA Agent returned an invalid structure."
        )

    # ========================================================
    # GET TEST SCENARIOS
    # ========================================================

    test_scenarios = result.get(
        "test_scenarios",
        [],
    )

    if not isinstance(
        test_scenarios,
        list,
    ):

        test_scenarios = []

    # ========================================================
    # NORMALIZE TEST CASES
    # ========================================================

    normalized_tests = []

    for index, test_case in enumerate(
        test_scenarios,
        start=1,
    ):

        if not isinstance(
            test_case,
            dict,
        ):

            continue

        # ----------------------------------------------------
        # TEST CASE ID
        # ----------------------------------------------------

        test_case_id = test_case.get(
            "test_case_id"
        )

        if not test_case_id:

            test_case_id = (
                f"TC{index:03d}"
            )

        # ----------------------------------------------------
        # ACCEPTANCE CRITERIA IDS
        # ----------------------------------------------------

        acceptance_criteria_ids = (
            test_case.get(
                "acceptance_criteria_ids",
                [],
            )
        )

        if not isinstance(
            acceptance_criteria_ids,
            list,
        ):

            acceptance_criteria_ids = []

        # ----------------------------------------------------
        # STEPS
        # ----------------------------------------------------

        steps = test_case.get(
            "steps",
            [],
        )

        if not isinstance(
            steps,
            list,
        ):

            steps = []

        # ----------------------------------------------------
        # NORMALIZED TEST CASE
        # ----------------------------------------------------

        normalized_tests.append(
            {
                "test_case_id": str(
                    test_case_id
                ),

                "acceptance_criteria_ids": [
                    str(value)
                    for value in acceptance_criteria_ids
                ],

                "scenario": str(
                    test_case.get(
                        "scenario",
                        "",
                    )
                ),

                "test_type": str(
                    test_case.get(
                        "test_type",
                        "Functional",
                    )
                ),

                "priority": str(
                    test_case.get(
                        "priority",
                        "Medium",
                    )
                ),

                "preconditions": str(
                    test_case.get(
                        "preconditions",
                        "",
                    )
                ),

                "steps": [
                    str(step)
                    for step in steps
                ],

                "test_data": str(
                    test_case.get(
                        "test_data",
                        "",
                    )
                ),

                "expected_result": str(
                    test_case.get(
                        "expected_result",
                        "",
                    )
                ),
            }
        )

    # ========================================================
    # FINAL RESULT
    # ========================================================

    result[
        "test_scenarios"
    ] = normalized_tests

    return result


# ============================================================
# BACKWARD COMPATIBILITY
# ============================================================

def generate_qa_test_scenarios(
    product_manager_output: dict,
    business_analyst_output: dict,
) -> dict:

    return generate_qa(
        story_output=product_manager_output,
        business_output=business_analyst_output,
    )
