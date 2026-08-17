import json
import re

import httpx
from groq import Groq

from app.config import GROQ_API_KEY, GROQ_STORY_MODEL
from app.services.groq_service import (
    GroqConfigurationError,
    GroqRateLimitError,
    is_rate_limit_error,
)


# ============================================================
# GROQ CLIENT
# ============================================================
#
# This client is used by the Consolidated Story Agent.
#
# Keep one interactive generation within roughly a minute. Slow provider
# responses fail clearly instead of keeping the browser request open for many
# minutes; the user can submit again when the provider is available.
#
# ============================================================

client = Groq(
    api_key=GROQ_API_KEY,
    timeout=httpx.Timeout(
        connect=10.0,
        read=65.0,
        write=65.0,
        pool=65.0,
    ),
    max_retries=0,
)


# ============================================================
# MODEL
# ============================================================

MODEL = GROQ_STORY_MODEL

# The compact prompt is intentionally kept below ~1,000 tokens. This leaves
# enough of the account's 8,000 TPM limit for a complete JSON response. A
# bounded output is essential for interactive generation latency.
# The Groq account has an 8,000 TPM budget. Reserve space for the prompt so a
# normal request does not fail before generation merely because of its maximum
# output reservation. The QA instruction remains scope-driven, not count-capped.
MAX_COMPLETION_TOKENS = 5200


# ============================================================
# SYSTEM PROMPT
# ============================================================
#
# The consolidated agent produces the complete StoryPilot AI
# output in a SINGLE Groq API call.
#
# This replaces the previous 7-call multi-agent pipeline
# (Product Manager -> Business Analyst -> QA -> Technical ->
# Risk -> Story Point -> Review).
#
# Generating the complete story in one call dramatically reduces
# Groq API request consumption, which keeps the free-tier rate
# limit from being exhausted after just a few story generations.
#
# ============================================================

SYSTEM_PROMPT = """
You are the complete StoryPilot AI multi-agent system.

You combine the expertise of:

- Product Manager Agent
- Business Analyst Agent
- QA Engineer Agent
- Technical Analysis Agent
- Risk Analysis Agent
- Story Point Estimation Agent
- Final Review Agent

Your responsibility is to analyze a product requirement and
produce a complete, high-quality, Azure DevOps-ready Agile
user story in ONE comprehensive output.

You are an expert in Product Management, Business Analysis,
Agile, Scrum, QA Engineering, Software Architecture, Risk
Analysis, Story Point Estimation, and Quality Review.

============================================================
OUTPUT SECTIONS
============================================================

Produce ALL of the following sections in a single JSON object:

1. PRODUCT-MANAGER SECTION

- Feature title
- Module
- Story type (Feature / Enhancement / Bug / Improvement)
- Priority (Critical / High / Medium / Low)
- User role
- Business value
- User story following the format:
  As a [role], I want [capability], So that [business value].
- Product outcome
- Assumptions
- Dependencies
- Initial acceptance criteria (atomic, testable, Given/When/Then)

2. BUSINESS-ANALYST SECTION

- Requirement summary
- Requirement quality (Excellent / Good / Needs Clarification)
- Business rules: Produce 6 to 8 meaningful, specific business
  rules that govern the feature. Each rule must be concrete,
  actionable, and directly derived from the requirement. Do not
  produce generic or duplicate rules.
- Preconditions
- Refined acceptance criteria (improve the Product Manager
  criteria; keep all given/when/then fields non-empty)
- Edge cases
- Clarification questions

3. QA SECTION

- Test scenarios directly traceable to acceptance criteria.
  Produce 6 to 8 meaningful test cases. Every test case must
  include:
  test_case_id, acceptance_criteria_ids, scenario, test_type,
  priority, preconditions, steps, test_data, expected_result.
  Cover positive, negative, validation, boundary, error
  handling, security, authorization, UI, workflow, and
  integration tests where applicable.
  Do not produce generic test cases such as "Verify the feature
  works." Each test case must be specific and testable.

4. TECHNICAL-ANALYSIS SECTION

- technical_summary
- frontend (required + changes)
- backend (required + changes)
- api (required + changes: method, purpose, authentication,
  authorization, acceptance_criteria_ids)
- database (required + changes)
- security (requirement + acceptance_criteria_ids)
- integrations
- dependencies
- assumptions
- error_handling
- logging_and_monitoring
- performance_considerations
- testing_considerations
- IMPORTANT: Do not invent a technology stack. Describe the
  technical implications of the requirement without prescribing
  specific frameworks, libraries, or infrastructure unless they
  are explicitly required by the requirement.

5. RISK-ANALYSIS SECTION

- overall_risk_level (Low / Medium / High / Very High)
- risk_summary
- risks (risk_id, category, risk, impact, likelihood,
  risk_level, mitigation, related_acceptance_criteria)
- Cover security risks, data risks, workflow risks, and
  operational risks explicitly.
- assumptions
- dependencies

6. STORY-POINT SECTION

- story_points: Estimate 8 or 13 story points. This story
  involves multiple analysis dimensions (product, business,
  QA, technical, risk) and typically requires substantial
  effort. Choose 8 when the scope is moderate with clear
  requirements. Choose 13 when the scope is large, complex,
  or has significant ambiguity.
- story_point_reason: Provide an evidence-based justification
  explaining why the chosen estimate reflects the complexity,
  scope, and risk of this story. Reference specific factors
  such as the number of acceptance criteria, business rules,
  test cases, technical complexity, and risk level.
- estimation_factors
- complexity (Low / Medium / High / Very High)
- should_split (true/false)
- split_reason

7. FINAL REVIEW SECTION

- status: Set to NEEDS_REVIEW when the output has coverage
  gaps, missing fields, weak sections, or inconsistencies.
  Set to PASS only when every section is complete, all
  acceptance criteria are covered by test cases, and there
  are no significant findings. Given the complexity of this
  output, NEEDS_REVIEW is the expected status in most cases.
- quality_score (integer 0-100)
- summary
- findings (finding_id, severity, category, issue, evidence,
  recommendation, related_acceptance_criteria)
- missing_acceptance_criteria
- uncovered_acceptance_criteria
- recommendations
- approved_for_final_output (true/false)

============================================================
DEFINITION OF DONE
============================================================

Also provide a definition_of_done list containing standard
completion checks such as:

- Development is complete.
- Code review is complete.
- Unit tests pass.
- Functional testing is complete.
- Acceptance criteria are validated.
- Negative scenarios are validated.
- Security and authorization are validated.
- Error handling is validated.
- Documentation is updated.
- No critical or high defects remain open.
- Build and code-quality checks pass.

============================================================
QUALITY RULES
============================================================

- The user story must describe exactly ONE clear user outcome.
- Acceptance criteria must be atomic, testable, unambiguous,
  and directly related to the requirement.
- Every acceptance criterion MUST have non-empty given, when,
  and then values. Do not return blank or placeholder fields.
- Every test case MUST map to at least one acceptance
  criterion via acceptance_criteria_ids.
- Produce 6 to 8 meaningful test cases. Do not generate
  generic test cases such as "Verify the feature works."
- Produce 6 to 8 meaningful business rules. Do not generate
  generic or duplicate rules.
- The technical analysis must stay directly connected to the
  requirement. Do not invent unrelated architecture or a
  specific technology stack.
- Risks must be specific and actionable, not generic. Cover
  security, data, workflow, and operational risks.
- The final review must identify real inconsistencies, missing
  coverage, and quality gaps. Set status to NEEDS_REVIEW when
  coverage gaps exist.
- Do not invent functionality that is unrelated to the
  requirement.
- You MUST produce EVERY field shown in the OUTPUT structure.
  Do not omit fields. Do not return null.
- user_role must be a specific, concrete user type
  (e.g. "registered user", "administrator", "customer service manager").
- business_value must describe the measurable outcome of the
  story.
- product_outcome must describe the business or user outcome
  achieved after implementation.
- acceptance_criteria must have at least 3 well-formed criteria.
- test_scenarios must contain 6 to 8 well-formed test cases,
  each covering at least one acceptance criterion.
- business_rules must contain 6 to 8 well-formed business rules.
- story_points must be 8 or 13 with an evidence-based
  justification in story_point_reason.
- quality_score must be an integer 0-100 and must be realistic:
  missing or weak fields lower the score.

============================================================
OUTPUT
============================================================

Return ONLY valid JSON using EXACTLY this structure:

{
    "title": "",
    "module": "",
    "story_type": "",
    "priority": "",
    "user_role": "",
    "business_value": "",
    "user_story": "",
    "product_outcome": "",
    "assumptions": [""],
    "dependencies": [""],
    "acceptance_criteria": [
        {
            "id": "AC001",
            "given": "",
            "when": "",
            "then": ""
        }
    ],
    "definition_of_done": [""],

    "requirement_summary": "",
    "requirement_quality": "Good",
    "business_rules": [""],
    "preconditions": [""],
    "edge_cases": [""],
    "clarification_questions": [""],

    "test_scenarios": [
        {
            "test_case_id": "TC001",
            "acceptance_criteria_ids": ["AC001"],
            "scenario": "",
            "test_type": "Functional",
            "priority": "High",
            "preconditions": "",
            "steps": [""],
            "test_data": "",
            "expected_result": ""
        }
    ],

    "technical_analysis": {
        "technical_summary": "",
        "frontend": {"required": true, "changes": [""]},
        "backend": {"required": true, "changes": [""]},
        "api": {
            "required": true,
            "changes": [
                {
                    "method": "",
                    "purpose": "",
                    "authentication": "",
                    "authorization": "",
                    "acceptance_criteria_ids": []
                }
            ]
        },
        "database": {"required": false, "changes": [""]},
        "security": [
            {
                "requirement": "",
                "acceptance_criteria_ids": []
            }
        ],
        "integrations": [""],
        "dependencies": [""],
        "assumptions": [""],
        "error_handling": [""],
        "logging_and_monitoring": [""],
        "performance_considerations": [""],
        "testing_considerations": [""]
    },

    "overall_risk_level": "Medium",
    "risk_summary": "",
    "risks": [
        {
            "risk_id": "R001",
            "category": "",
            "risk": "",
            "impact": "Medium",
            "likelihood": "Medium",
            "risk_level": "Medium",
            "mitigation": "",
            "related_acceptance_criteria": ["AC001"]
        }
    ],

    "story_points": 8,
    "story_point_reason": "",
    "estimation_factors": [""],
    "complexity": "High",
    "should_split": false,
    "split_reason": "",

    "quality_review": {
        "status": "NEEDS_REVIEW",
        "quality_score": 75,
        "summary": "",
        "findings": [
            {
                "finding_id": "F001",
                "severity": "Medium",
                "category": "",
                "issue": "",
                "evidence": "",
                "recommendation": "",
                "related_acceptance_criteria": []
            }
        ]
    },
    "quality_score": 75,
    "review_status": "NEEDS_REVIEW",
    "review_summary": "",
    "approved_for_final_output": false,
    "recommendations": [""],
    "missing_acceptance_criteria": [],
    "uncovered_acceptance_criteria": []
}

Do not put markdown inside the JSON.
"""


# The detailed prompt above remains useful reference material, but requesting
# every analysis field and 25+ test cases in one response exceeds the current
# Groq account's token budget. The normalizer below supplies safe defaults for
# omitted optional fields, so use this bounded contract for live generation.
COMPACT_SYSTEM_PROMPT = """
Return only one valid JSON object. No markdown, explanations, or code fences.

Create one coherent, implementation-ready Agile user story. Quality matters
more than length. The user story must be exactly: "As a [specific role], I want
[capability], so that [measurable outcome]." Do not broaden the feature merely
to create more sections.

Derive only relevant, atomic acceptance criteria. Each must have a unique AC ID
and non-empty Given, When, Then values. Do not duplicate or split a single
behaviour into filler criteria. Create only the positive, validation, negative,
authorization, failure, integration, edge, security, or performance behaviour
that the requirement actually warrants. Do not invent numeric performance
targets, APIs, technologies, policies, integrations, or database behaviour.
Unknown details belong in assumptions or clarification_questions; return ["N/A"]
for clarification_questions only when the requirement is sufficiently clear.

Include a requirements list with every independently stated input requirement,
and map each to one or more valid AC IDs. Generate enough independently
executable QA tests for meaningful coverage, not a fixed count. Each test must
have unique TC ID, valid AC IDs, concrete scenario, type, preconditions, ordered
steps, meaningful test data, expected result, and priority. A test must not copy
an AC verbatim. "N/A" is invalid for test data unless no data can genuinely
exist; explain why instead. Use only applicable test categories.

Technical analysis must explicitly distinguish known requirements, assumptions,
and suggested approach. Use the verified StoryPilot context only when relevant;
never claim SQLite isolation or any HTTP/API detail without evidence. For
privileged workflows include relevant least-privilege, server-side authorization,
self-approval prevention, auditability, session validation, and fail-closed
controls. Risks must be specific populated objects with a concrete mitigation,
never placeholders. Story points must reflect actual workflows, states,
integrations, security, data, UI, concurrency, and testing effort.

The server validates IDs, coverage, duplicates, missing fields, unsupported
claims, and scoring. Be candid: return a lower quality score and findings for
unknown or incomplete inputs rather than fabricating certainty. Do not add fields
not in this schema.

Use only established facts from the requirement. The verified StoryPilot
context is a Next.js frontend, FastAPI/Python backend, SQLAlchemy persistence,
and a SQLite default database. Mention these only when a technical change
actually requires them; otherwise identify unknowns as assumptions or
clarification questions. Never invent APIs, integrations, policies, SLAs, or
compliance obligations.

For stateful workflows, define the relevant states and valid transitions in
acceptance criteria, business rules, technical analysis, and tests. Cover
rejection, cancellation, expiry/revocation, failure recovery, unauthorized
transitions, and concurrency only when they apply. For privileged access,
authorization or risk-evaluation failures must fail closed or require manual
review; never grant access by default. Every risk must be a relevant populated
object—never use placeholder values. Story-point rationale must cite actual
scope, dependencies, security, workflow, and QA factors.

{
  "title": "", "module": "", "priority": "", "story_type": "",
  "user_role": "", "business_value": "", "user_story": "",
  "product_outcome": "", "assumptions": [""], "dependencies": [""],
  "requirements": [{"id": "REQ001", "description": "", "acceptance_criteria_ids": ["AC001"]}],
  "acceptance_criteria": [{"id": "AC001", "given": "", "when": "", "then": ""}],
  "requirement_summary": "", "requirement_quality": "Good",
  "business_rules": [""], "preconditions": [""], "edge_cases": [""],
  "clarification_questions": [""],
  "test_scenarios": [{"test_case_id": "TC001", "acceptance_criteria_ids": ["AC001"], "scenario": "", "test_type": "Functional", "priority": "High", "preconditions": "", "steps": [""], "test_data": "", "expected_result": ""}],
  "technical_analysis": {"technical_summary": "", "frontend": {"required": false, "changes": []}, "backend": {"required": false, "changes": []}, "api": {"required": false, "changes": []}, "database": {"required": false, "changes": []}, "security": [], "integrations": [], "dependencies": [], "assumptions": [], "error_handling": [], "logging_and_monitoring": [], "performance_considerations": [], "testing_considerations": []},
  "overall_risk_level": "Medium", "risk_summary": "", "risks": [],
  "story_points": 8, "story_point_reason": "", "estimation_factors": [],
  "complexity": "Medium", "should_split": false, "split_reason": "",
  "quality_review": {"status": "NEEDS_REVIEW", "quality_score": 75, "summary": "", "findings": []},
  "quality_score": 75, "review_status": "NEEDS_REVIEW", "review_summary": "",
  "approved_for_final_output": false, "recommendations": [],
  "missing_acceptance_criteria": [], "uncovered_acceptance_criteria": []
}
"""


# ============================================================
# PROMPT BUILDER
# ============================================================

def _build_prompt(
    feature_name: str,
    module: str,
    priority: str,
    story_type: str,
    description: str,
) -> str:

    return f"""
Analyze the following product requirement and produce the
complete Agile user story with all analysis sections.

============================================================
REQUIREMENT
============================================================

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

Verified application context (use only when relevant): Next.js frontend;
FastAPI/Python backend; SQLAlchemy persistence; SQLite default database.
Unknown architecture or business-policy details must be labeled as assumptions
or clarification questions, never stated as confirmed facts.

============================================================
TASK
============================================================

Generate the complete StoryPilot AI output:

1. Product Manager story with acceptance criteria
2. Business Analyst refinement with 6-8 business rules
3. QA test scenarios sized to the story's scope, traced to acceptance criteria
4. Technical implementation analysis without inventing a stack
5. Risk analysis with security, data, workflow, and operational risks
6. Story point estimation (8 or 13) with evidence-based justification
7. Final quality review (NEEDS_REVIEW when coverage gaps exist)

Ensure every section is complete and internally consistent.

Return ONLY valid JSON using the required structure.
"""


# ============================================================
# VALIDATION HELPERS
# ============================================================

def _clean_string(
    value,
    default="",
) -> str:

    if value is None:
        return default

    if not isinstance(value, str):
        value = str(value)

    return value.strip()


def _clean_string_list(
    value,
) -> list:

    if not isinstance(value, list):
        return []

    result = []

    for item in value:
        cleaned = _clean_string(item)
        if cleaned:
            result.append(cleaned)

    return result


def _normalize_acceptance_criteria(
    value,
) -> list:

    if not isinstance(value, list):
        return []

    normalized = []
    seen_content = set()
    used_ids = set()

    for index, criterion in enumerate(value, start=1):

        if not isinstance(criterion, dict):
            continue

        given = _clean_string(criterion.get("given"))
        when = _clean_string(criterion.get("when"))
        then = _clean_string(criterion.get("then"))

        if not (given and when and then):
            continue

        criterion_id = _clean_string(criterion.get("id"), f"AC{index:03d}")
        if not re.fullmatch(r"AC\d{3}", criterion_id) or criterion_id in used_ids:
            criterion_id = f"AC{len(normalized) + 1:03d}"
            while criterion_id in used_ids:
                criterion_id = f"AC{int(criterion_id[2:]) + 1:03d}"
        content_key = " ".join(f"{given} {when} {then}".lower().split())
        if content_key in seen_content:
            continue
        seen_content.add(content_key)
        used_ids.add(criterion_id)

        normalized.append(
            {
                "id": criterion_id,
                "criterion": _clean_string(
                    criterion.get("criterion") or criterion.get("description"),
                    f"Given {given} When {when} Then {then}",
                ),
                "given": given,
                "when": when,
                "then": then,
            }
        )

    return normalized


def _normalize_test_scenarios(
    value,
) -> list:

    if not isinstance(value, list):
        return []

    normalized = []
    seen_content = set()

    for index, test_case in enumerate(value, start=1):

        if not isinstance(test_case, dict):
            continue

        # IDs belong to a story, not to the model session. Recreate them from
        # the current list so every generated story starts at TC001.
        test_case_id = f"TC{index:03d}"

        acceptance_criteria_ids = (
            test_case.get("acceptance_criteria_ids", [])
        )

        if not isinstance(acceptance_criteria_ids, list):
            acceptance_criteria_ids = []

        acceptance_criteria_ids = [
            _clean_string(ac_id)
            for ac_id in acceptance_criteria_ids
            if _clean_string(ac_id)
        ]

        steps = test_case.get("steps", [])

        if not isinstance(steps, list):
            steps = []

        scenario = _clean_string(test_case.get("scenario"))
        test_data = _clean_string(test_case.get("test_data"))
        expected_result = _clean_string(test_case.get("expected_result"))
        preconditions = _clean_string(test_case.get("preconditions"))
        cleaned_steps = _clean_string_list(steps)
        # A case without executable detail is not a test case. It is reported
        # by the quality audit instead of being padded with placeholder data.
        if not (scenario and test_data and expected_result and preconditions and cleaned_steps):
            continue
        content_key = " ".join(f"{scenario} {test_data} {expected_result}".lower().split())
        if content_key in seen_content:
            continue
        seen_content.add(content_key)

        normalized.append(
            {
                "test_case_id": test_case_id,
                "acceptance_criteria_ids": acceptance_criteria_ids,
                "scenario": scenario,
                "test_type": _clean_string(
                    test_case.get("test_type"),
                    "Functional",
                ),
                "priority": _clean_string(
                    test_case.get("priority"),
                    "Medium",
                ),
                "preconditions": preconditions,
                "steps": cleaned_steps,
                "test_data": test_data,
                "expected_result": expected_result,
            }
        )

    return normalized


def _normalize_risks(
    value,
) -> list:

    if not isinstance(value, list):
        return []

    normalized = []

    for index, risk in enumerate(value, start=1):

        if not isinstance(risk, dict):
            continue

        risk_id = _clean_string(
            risk.get("risk_id"),
            f"R{index:03d}",
        )

        related_ac = risk.get(
            "related_acceptance_criteria",
            [],
        )

        if not isinstance(related_ac, list):
            related_ac = []

        related_ac = _clean_string_list(related_ac)

        normalized.append(
            {
                "risk_id": risk_id,
                "category": _clean_string(
                    risk.get("category"),
                    "Functional",
                ),
                "risk": _clean_string(risk.get("risk")),
                "impact": _clean_string(
                    risk.get("impact"),
                    "Medium",
                ),
                "likelihood": _clean_string(
                    risk.get("likelihood"),
                    "Medium",
                ),
                "risk_level": _clean_string(
                    risk.get("risk_level"),
                    "Medium",
                ),
                "mitigation": _clean_string(
                    risk.get("mitigation")
                ),
                "related_acceptance_criteria": related_ac,
            }
        )

    return normalized


def _normalize_technical_analysis(
    value,
) -> dict:

    if not isinstance(value, dict):
        return {}

    def section_dict(section):
        if not isinstance(section, dict):
            return {
                "required": False,
                "changes": [],
            }
        return {
            "required": bool(
                section.get("required", False)
            ),
            "changes": _clean_string_list(
                section.get("changes", [])
            ),
        }

    frontend = section_dict(value.get("frontend"))
    backend = section_dict(value.get("backend"))
    database = section_dict(value.get("database"))

    # API section
    api = value.get("api", {})

    if not isinstance(api, dict):
        api = {}

    api_changes = api.get("changes", [])

    if not isinstance(api_changes, list):
        api_changes = []

    normalized_api_changes = []

    for change in api_changes:

        if not isinstance(change, dict):
            continue

        ac_ids = change.get("acceptance_criteria_ids", [])

        if not isinstance(ac_ids, list):
            ac_ids = []

        ac_ids = _clean_string_list(ac_ids)

        normalized_api_changes.append(
            {
                "method": _clean_string(
                    change.get("method")
                ),
                "purpose": _clean_string(
                    change.get("purpose")
                ),
                "authentication": _clean_string(
                    change.get("authentication")
                ),
                "authorization": _clean_string(
                    change.get("authorization")
                ),
                "acceptance_criteria_ids": ac_ids,
            }
        )

    # Security section
    security = value.get("security", [])

    if not isinstance(security, list):
        security = []

    normalized_security = []

    for item in security:

        if not isinstance(item, dict):
            continue

        ac_ids = item.get("acceptance_criteria_ids", [])

        if not isinstance(ac_ids, list):
            ac_ids = []

        ac_ids = _clean_string_list(ac_ids)

        normalized_security.append(
            {
                "requirement": _clean_string(
                    item.get("requirement")
                ),
                "acceptance_criteria_ids": ac_ids,
            }
        )

    return {
        "technical_summary": _clean_string(
            value.get("technical_summary")
        ),
        "frontend": frontend,
        "backend": backend,
        "api": {
            "required": bool(api.get("required", False)),
            "changes": normalized_api_changes,
        },
        "database": database,
        "security": normalized_security,
        "integrations": _clean_string_list(
            value.get("integrations", [])
        ),
        "dependencies": _clean_string_list(
            value.get("dependencies", [])
        ),
        "assumptions": _clean_string_list(
            value.get("assumptions", [])
        ),
        "error_handling": _clean_string_list(
            value.get("error_handling", [])
        ),
        "logging_and_monitoring": _clean_string_list(
            value.get("logging_and_monitoring", [])
        ),
        "performance_considerations": _clean_string_list(
            value.get("performance_considerations", [])
        ),
        "testing_considerations": _clean_string_list(
            value.get("testing_considerations", [])
        ),
    }


def _normalize_quality_review(
    value,
) -> dict:

    if not isinstance(value, dict):
        return {}

    status = _clean_string(
        value.get("status"),
        "NEEDS_REVIEW",
    ).upper()

    if status not in ["PASS", "FAIL", "NEEDS_REVIEW"]:
        status = "NEEDS_REVIEW"

    quality_score = value.get("quality_score", 0)

    try:
        quality_score = int(quality_score)
    except (TypeError, ValueError):
        quality_score = 0

    quality_score = max(0, min(100, quality_score))

    findings = value.get("findings", [])

    if not isinstance(findings, list):
        findings = []

    normalized_findings = []

    for index, finding in enumerate(findings, start=1):

        if not isinstance(finding, dict):
            continue

        finding_id = _clean_string(
            finding.get("finding_id"),
            f"F{index:03d}",
        )

        related_ac = finding.get(
            "related_acceptance_criteria",
            [],
        )

        if not isinstance(related_ac, list):
            related_ac = []

        related_ac = _clean_string_list(related_ac)

        severity = _clean_string(
            finding.get("severity"),
            "Medium",
        )

        if severity not in ["Low", "Medium", "High", "Critical"]:
            severity = "Medium"

        normalized_findings.append(
            {
                "finding_id": finding_id,
                "severity": severity,
                "category": _clean_string(
                    finding.get("category"),
                    "General",
                ),
                "issue": _clean_string(finding.get("issue")),
                "evidence": _clean_string(
                    finding.get("evidence")
                ),
                "recommendation": _clean_string(
                    finding.get("recommendation")
                ),
                "related_acceptance_criteria": related_ac,
            }
        )

    return {
        "status": status,
        "quality_score": quality_score,
        "summary": _clean_string(value.get("summary")),
        "findings": normalized_findings,
    }


def _validate_traceability(result: dict, description: str) -> tuple[dict, list[str]]:
    """Keep only valid AC links and make uncovered behaviour visible.

    The model proposes the semantic mappings; this deterministic gate prevents
    malformed IDs or an omitted test from silently reaching the API response.
    """
    criteria = result.get("acceptance_criteria", [])
    ac_ids = {
        item["id"] for item in criteria
        if isinstance(item, dict) and item.get("id")
    }

    tests = result.get("test_scenarios", [])
    valid_tests = []
    for test in tests:
        if not isinstance(test, dict):
            continue
        links = [ac_id for ac_id in test.get("acceptance_criteria_ids", []) if ac_id in ac_ids]
        if not links:
            continue
        test["acceptance_criteria_ids"] = links
        valid_tests.append(test)
    for index, test in enumerate(valid_tests, start=1):
        test["test_case_id"] = f"TC{index:03d}"

    covered: dict[str, list[str]] = {ac_id: [] for ac_id in ac_ids}
    for test in valid_tests:
        for ac_id in test["acceptance_criteria_ids"]:
            covered[ac_id].append(test["test_case_id"])

    result["test_scenarios"] = valid_tests

    raw_requirements = result.get("requirements", [])
    requirements = []
    if isinstance(raw_requirements, list):
        for index, requirement in enumerate(raw_requirements, start=1):
            if not isinstance(requirement, dict):
                continue
            requirement_id = _clean_string(requirement.get("id"), f"REQ{index:03d}")
            requirement_id = requirement_id if re.fullmatch(r"REQ\d{3}", requirement_id) else f"REQ{index:03d}"
            linked = [ac_id for ac_id in requirement.get("acceptance_criteria_ids", []) if ac_id in ac_ids]
            requirements.append({
                "id": requirement_id,
                "description": _clean_string(requirement.get("description")),
                "acceptance_criteria_ids": linked,
            })

    # A missing LLM requirement list is a review failure, not a reason to erase
    # the original requirement from the traceability chain.
    if not requirements:
        clauses = [part.strip() for part in re.split(r"[\n;]+", description) if part.strip()]
        requirements = [
            {"id": f"REQ{index:03d}", "description": clause, "acceptance_criteria_ids": []}
            for index, clause in enumerate(clauses or [description.strip()], start=1)
        ]

    missing_requirements = [item["id"] for item in requirements if not item["acceptance_criteria_ids"]]
    return {
        "requirement": description,
        "requirements": requirements,
        "acceptance_criteria": [item["id"] for item in criteria if isinstance(item, dict) and item.get("id")],
        "test_cases": [
            {"test_case_id": test["test_case_id"], "acceptance_criteria_ids": test["acceptance_criteria_ids"]}
            for test in valid_tests
        ],
        "coverage_matrix": covered,
    }, missing_requirements


def _quality_audit(result: dict, description: str) -> list[dict]:
    """Return evidence-based findings for defects the model must not self-score.

    This deliberately scores observable quality, not document length.  It is a
    deterministic last gate: invalid references and vague placeholders cannot
    become a high score merely because the response has many sections.
    """
    findings = []

    def add(category: str, issue: str, evidence: str, severity="Medium"):
        findings.append({
            "finding_id": f"AUTO{len(findings) + 1:03d}",
            "severity": severity,
            "category": category,
            "issue": issue,
            "evidence": evidence,
            "recommendation": "Regenerate or refine the affected section with requirement-specific detail.",
            "related_acceptance_criteria": [],
        })

    criteria = result.get("acceptance_criteria", [])
    tests = result.get("test_scenarios", [])
    ac_ids = {item.get("id") for item in criteria if isinstance(item, dict)}
    if len(criteria) < 3:
        add("Acceptance criteria", "Too few acceptance criteria", "Fewer than three observable criteria were generated.", "High")
    if len(ac_ids) != len(criteria):
        add("Traceability", "Duplicate acceptance-criteria IDs", "Acceptance-criteria IDs are not unique.", "High")
    if not tests:
        add("QA", "No independently executable test cases", "No complete test scenarios were generated.", "High")
    for test in tests:
        linked = test.get("acceptance_criteria_ids", [])
        if not linked or any(ac_id not in ac_ids for ac_id in linked):
            add("Traceability", "Invalid test-to-AC mapping", f"{test.get('test_case_id', 'Test case')} has missing or invalid AC references.", "High")
        if test.get("test_data", "").strip().lower() in {"n/a", "na", "none", ""}:
            add("QA", "Meaningless test data", f"{test.get('test_case_id', 'Test case')} has placeholder test data.")
    coverage = result.get("traceability", {}).get("coverage_matrix", {})
    for ac_id in ac_ids:
        if not coverage.get(ac_id):
            add("Traceability", "Orphan acceptance criterion", f"{ac_id} is not covered by any independently executable test case.", "High")

    risks = result.get("risks", [])
    for risk in risks:
        if not isinstance(risk, dict):
            continue
        if any("unspecified" in str(risk.get(key, "")).lower() for key in ("risk", "mitigation")):
            add("Risk", "Generic risk record", f"{risk.get('risk_id', 'Risk')} contains an unspecified value.")

    description_lower = description.lower()
    security_relevant = any(token in description_lower for token in ("permission", "role", "access", "privileg", "authoriz", "security"))
    if security_relevant and not result.get("technical_analysis", {}).get("security"):
        add("Security", "Security controls are missing", "The requirement is access/security-sensitive but no security control is specified.", "High")
    integration_relevant = any(token in description_lower for token in ("integration", "webhook", "api", "third-party", "external system"))
    if integration_relevant and not result.get("technical_analysis", {}).get("error_handling"):
        add("Error handling", "Integration failure handling is missing", "The requirement references an integration but no failure behaviour is specified.", "High")

    technical_text = json.dumps(result.get("technical_analysis", {})).lower()
    if "sqlite" in technical_text and any(token in technical_text for token in ("isolation", "serializable", "transaction guarantee")):
        add("Technical credibility", "Unsupported SQLite transaction claim", "Technical analysis asserts SQLite transaction/isolation behaviour without project evidence.")
    return findings


def _calculate_quality_score(result: dict, findings: list[dict]) -> int:
    """Score ten quality dimensions with deterministic, capped deductions."""
    score = 100
    deductions = {"High": 12, "Critical": 18, "Medium": 6, "Low": 3}
    for finding in findings:
        score -= deductions.get(finding.get("severity"), 6)
    if not result.get("business_rules"):
        score -= 8
    if not result.get("technical_analysis", {}).get("technical_summary"):
        score -= 8
    if not result.get("user_story", "").lower().startswith("as a "):
        score -= 10
    return max(0, min(100, score))


def _normalize_result(
    result: dict,
    feature_name: str,
    module: str,
    priority: str,
    story_type: str,
    description: str,
) -> dict:

    # --------------------------------------------------------
    # BASIC FIELDS
    # --------------------------------------------------------

    title = _clean_string(
        result.get("title"),
        feature_name,
    )

    result["title"] = title

    result["feature_name"] = feature_name

    result["module"] = _clean_string(
        result.get("module"),
        module,
    )

    result["priority"] = _clean_string(
        result.get("priority"),
        priority,
    )

    result["story_type"] = _clean_string(
        result.get("story_type"),
        story_type,
    )

    result["user_role"] = _clean_string(
        result.get("user_role")
    )

    result["business_value"] = _clean_string(
        result.get("business_value")
    )

    result["user_story"] = _clean_string(
        result.get("user_story")
    )

    result["product_outcome"] = _clean_string(
        result.get("product_outcome")
    )

    result["assumptions"] = _clean_string_list(
        result.get("assumptions", [])
    )

    result["dependencies"] = _clean_string_list(
        result.get("dependencies", [])
    )

    result["acceptance_criteria"] = (
        _normalize_acceptance_criteria(
            result.get("acceptance_criteria", [])
        )
    )

    # --------------------------------------------------------
    # DEFINITION OF DONE
    # --------------------------------------------------------

    default_dod = [
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

    definition_of_done = _clean_string_list(
        result.get("definition_of_done", [])
    )

    if not definition_of_done:
        definition_of_done = default_dod

    result["definition_of_done"] = definition_of_done

    # --------------------------------------------------------
    # BUSINESS ANALYST SECTION
    # --------------------------------------------------------

    result["requirement_summary"] = _clean_string(
        result.get("requirement_summary"),
        f"Business analysis completed for {feature_name} "
        f"in the {module} module.",
    )

    requirement_quality = _clean_string(
        result.get("requirement_quality"),
        "Good",
    )

    if requirement_quality not in [
        "Excellent",
        "Good",
        "Needs Clarification",
    ]:
        requirement_quality = "Good"

    result["requirement_quality"] = requirement_quality

    result["business_rules"] = _clean_string_list(
        result.get("business_rules", [])
    )

    result["preconditions"] = _clean_string_list(
        result.get("preconditions", [])
    )

    result["edge_cases"] = _clean_string_list(
        result.get("edge_cases", [])
    )

    result["clarification_questions"] = _clean_string_list(
        result.get("clarification_questions", [])
    )

    # --------------------------------------------------------
    # QA SECTION
    # --------------------------------------------------------

    result["test_scenarios"] = _normalize_test_scenarios(
        result.get("test_scenarios", [])
    )

    # --------------------------------------------------------
    # TECHNICAL SECTION
    # --------------------------------------------------------

    result["technical_analysis"] = _normalize_technical_analysis(
        result.get("technical_analysis", {})
    )

    # --------------------------------------------------------
    # RISK SECTION
    # --------------------------------------------------------

    overall_risk = _clean_string(
        result.get("overall_risk_level"),
        "Medium",
    )

    if overall_risk not in [
        "Low",
        "Medium",
        "High",
        "Very High",
        "Critical",
    ]:
        overall_risk = "Medium"

    result["overall_risk_level"] = overall_risk

    result["risk_summary"] = _clean_string(
        result.get("risk_summary")
    )

    result["risks"] = _normalize_risks(
        result.get("risks", [])
    )

    # --------------------------------------------------------
    # STORY POINT SECTION
    # --------------------------------------------------------

    valid_story_points = {1, 2, 3, 5, 8, 13}

    story_points = result.get("story_points", 8)

    try:
        story_points = int(story_points)
    except (TypeError, ValueError):
        story_points = 8

    if story_points not in valid_story_points:
        story_points = 8

    result["story_points"] = story_points

    result["story_point_reason"] = _clean_string(
        result.get("story_point_reason")
    )

    result["estimation_factors"] = _clean_string_list(
        result.get("estimation_factors", [])
    )

    complexity = _clean_string(
        result.get("complexity"),
        "High",
    )

    if complexity not in [
        "Low",
        "Medium",
        "High",
        "Very High",
    ]:
        complexity = "High"

    result["complexity"] = complexity

    should_split = result.get("should_split", False)

    if isinstance(should_split, str):
        should_split = should_split.strip().lower() == "true"
    elif not isinstance(should_split, bool):
        should_split = bool(should_split)

    result["should_split"] = should_split

    split_reason = _clean_string(
        result.get("split_reason")
    )

    if not should_split:
        split_reason = ""

    result["split_reason"] = split_reason

    # --------------------------------------------------------
    # REVIEW SECTION
    # --------------------------------------------------------

    quality_review = _normalize_quality_review(
        result.get("quality_review", {})
    )

    result["quality_review"] = quality_review

    quality_score = result.get("quality_score", 0)

    try:
        quality_score = int(quality_score)
    except (TypeError, ValueError):
        quality_score = 0

    quality_score = max(0, min(100, quality_score))

    result["quality_score"] = quality_score

    review_status = _clean_string(
        result.get("review_status"),
        quality_review.get("status", "NEEDS_REVIEW"),
    ).upper()

    if review_status not in ["PASS", "FAIL", "NEEDS_REVIEW"]:
        review_status = "NEEDS_REVIEW"

    result["review_status"] = review_status

    approved = result.get(
        "approved_for_final_output",
        quality_review.get("status") == "PASS",
    )

    if isinstance(approved, str):
        approved = approved.strip().lower() == "true"

    result["approved_for_final_output"] = bool(approved)

    result["review_summary"] = _clean_string(
        result.get("review_summary"),
        quality_review.get("summary", ""),
    )

    result["recommendations"] = _clean_string_list(
        result.get("recommendations", [])
    )

    result["missing_acceptance_criteria"] = _clean_string_list(
        result.get("missing_acceptance_criteria", [])
    )

    result["uncovered_acceptance_criteria"] = _clean_string_list(
        result.get("uncovered_acceptance_criteria", [])
    )

    # --------------------------------------------------------
    # TRACEABILITY
    # --------------------------------------------------------

    traceability, missing_requirements = _validate_traceability(
        result,
        description,
    )
    result["traceability"] = traceability

    if missing_requirements:
        result["missing_acceptance_criteria"] = sorted(set(
            result["missing_acceptance_criteria"] + missing_requirements
        ))
        result["recommendations"] = list(dict.fromkeys(
            result["recommendations"] + [
                f"Map {requirement_id} to one or more acceptance criteria before approval."
                for requirement_id in missing_requirements
            ]
        ))
        result["review_status"] = "NEEDS_REVIEW"
        result["approved_for_final_output"] = False
        result["quality_score"] = min(result["quality_score"], 89)
        result["quality_review"]["status"] = "NEEDS_REVIEW"
        result["quality_review"]["quality_score"] = min(
            result["quality_review"].get("quality_score", result["quality_score"]),
            89,
        )

    audit_findings = _quality_audit(result, description)
    if audit_findings:
        result["quality_review"]["findings"] = (
            result["quality_review"].get("findings", []) + audit_findings
        )
        result["review_status"] = "NEEDS_REVIEW"
        result["approved_for_final_output"] = False
        result["quality_review"]["status"] = "NEEDS_REVIEW"
        result["recommendations"] = list(dict.fromkeys(result["recommendations"] + [
            finding["recommendation"] for finding in audit_findings
        ]))

    # The model's score is advisory only. This score is computed from the
    # canonical content and validation findings, so output volume cannot inflate
    # it and the top band is reserved for content that passes every gate.
    computed_score = _calculate_quality_score(result, result["quality_review"].get("findings", []))
    result["quality_score"] = computed_score
    result["quality_review"]["quality_score"] = computed_score
    if computed_score < 95:
        result["review_status"] = "NEEDS_REVIEW"
        result["quality_review"]["status"] = "NEEDS_REVIEW"
        result["approved_for_final_output"] = False

    return result


# ============================================================
# CONSOLIDATED STORY GENERATION
# ============================================================

def generate_complete_story(
    feature_name: str,
    module: str,
    priority: str,
    story_type: str,
    description: str,
    image_bytes: bytes | None = None,
    image_content_type: str | None = None,
) -> dict:
    """
    Generate a complete StoryPilot AI user story in ONE Groq API call.

    This replaces the previous 7-call multi-agent pipeline. Generating
    everything in a single call dramatically reduces Groq API request
    consumption, preventing the free-tier per-minute rate limit from
    being exhausted after just a few story generations.

    The `image_bytes` and `image_content_type` parameters are accepted
    for signature compatibility but are not used, because the text
    generation model cannot interpret image pixels. The requirement
    text is the source of truth.
    """

    prompt = _build_prompt(
        feature_name=feature_name,
        module=module,
        priority=priority,
        story_type=story_type,
        description=description,
    )

    # ========================================================
    # SINGLE GROQ REQUEST
    # ========================================================

    try:

        completion = client.chat.completions.create(
            model=MODEL,
            temperature=0.2,
            max_completion_tokens=MAX_COMPLETION_TOKENS,
            reasoning_effort="low",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": COMPACT_SYSTEM_PROMPT,
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
                "Groq API rate limit exceeded. "
                "Please try again in a few minutes."
            ) from exc

        if getattr(exc, "status_code", None) in {401, 403, 404}:

            raise GroqConfigurationError(
                f"Configured Groq model '{MODEL}' is unavailable. "
                "Set GROQ_STORY_MODEL to a model enabled for this API key."
            ) from exc

        raise Exception(
            f"Consolidated Story Agent failed: {exc}"
        ) from exc

    # ========================================================
    # RESPONSE
    # ========================================================

    content = completion.choices[0].message.content

    if not content:

        raise Exception(
            "Consolidated Story Agent returned an empty response."
        )

    # ========================================================
    # JSON PARSING
    # ========================================================

    # Defensive handling for providers that still wrap JSON despite the prompt.
    json_content = content.strip()
    if json_content.startswith("```"):
        json_content = json_content.split("\n", 1)[-1]
        if json_content.endswith("```"):
            json_content = json_content[:-3]

    try:

        result = json.loads(json_content.strip())

    except json.JSONDecodeError as exc:

        finish_reason = getattr(completion.choices[0], "finish_reason", "unknown")
        print(
            "Consolidated Story Agent returned malformed JSON "
            f"(finish_reason={finish_reason}, characters={len(content)})."
        )

        raise Exception(
            "Consolidated Story Agent returned an incomplete JSON response."
        ) from exc

    if not isinstance(result, dict):

        raise Exception(
            "Consolidated Story Agent returned an invalid "
            "response structure."
        )

    # ========================================================
    # VALIDATION
    # ========================================================

    result = _normalize_result(
        result=result,
        feature_name=feature_name,
        module=module,
        priority=priority,
        story_type=story_type,
        description=description,
    )

    # ========================================================
    # RETURN
    # ========================================================

    return result
