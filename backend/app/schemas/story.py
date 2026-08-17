from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# ACCEPTANCE CRITERION
# ============================================================

class AcceptanceCriterion(BaseModel):
    id: str = Field(
        ...,
        description="Unique acceptance criterion ID such as AC001",
    )

    criterion: str = Field(
        ...,
        min_length=1,
        description="Human-readable acceptance criterion shown in the UI",
    )

    given: str = Field(
        ...,
        min_length=1,
        description="Precondition for the acceptance criterion",
    )

    when: str = Field(
        ...,
        min_length=1,
        description="User action or system event",
    )

    then: str = Field(
        ...,
        min_length=1,
        description="Expected observable system behavior",
    )


# ============================================================
# TEST SCENARIO
# ============================================================

class TestScenario(BaseModel):
    test_case_id: str = Field(
        ...,
        description="Unique test case ID such as TC001",
    )

    acceptance_criteria_ids: list[str] = Field(
        default_factory=list,
        description="Acceptance criteria covered by this test case",
    )

    scenario: str = Field(
        ...,
        min_length=1,
    )

    test_type: str = Field(
        ...,
        description=(
            "Functional, Positive, Negative, Validation, "
            "Boundary, Security, Authorization, UI, "
            "Workflow, Integration, Error Handling, etc."
        ),
    )

    priority: str = Field(
        ...,
        description="Critical, High, Medium, or Low",
    )

    preconditions: str = Field(
        ...,
        min_length=1,
    )

    steps: list[str] = Field(
        default_factory=list,
    )

    test_data: str = Field(
        default="",
    )

    expected_result: str = Field(
        ...,
        min_length=1,
    )


# ============================================================
# CREATE STORY
# ============================================================

class StoryCreate(BaseModel):
    feature_name: str
    module: str
    priority: str
    story_type: str
    description: str


# ============================================================
# STORY RESPONSE
# ============================================================

class StoryResponse(BaseModel):
    id: int

    feature_name: str

    title: str

    module: str

    priority: str

    story_type: str

    user_role: str = ""

    business_value: str

    user_story: str

    product_outcome: str = ""

    requirement_summary: str = ""

    requirement_quality: str = ""

    business_rules: list[str] = Field(
        default_factory=list,
    )

    preconditions: list[str] = Field(
        default_factory=list,
    )

    assumptions: list[str] = Field(
        default_factory=list,
    )

    dependencies: list[str] = Field(
        default_factory=list,
    )

    edge_cases: list[str] = Field(
        default_factory=list,
    )

    clarification_questions: list[str] = Field(
        default_factory=list,
    )

    acceptance_criteria: list[AcceptanceCriterion]

    definition_of_done: list[str] = Field(
        default_factory=list,
    )

    test_scenarios: list[TestScenario] = Field(
        default_factory=list,
    )

    technical_analysis: dict = Field(
        default_factory=dict,
    )

    overall_risk_level: str = ""

    risk_summary: str = ""

    risks: list = Field(
        default_factory=list,
    )

    story_points: int

    story_point_reason: str = ""

    complexity: str = ""

    estimation_factors: list[str] = Field(
        default_factory=list,
    )

    should_split: bool = False

    split_reason: str = ""

    traceability: dict = Field(
        default_factory=dict,
    )

    quality_review: dict = Field(
        default_factory=dict,
    )

    quality_score: int = 0

    review_status: str = ""

    review_summary: str = ""

    missing_acceptance_criteria: list[str] = Field(
        default_factory=list,
    )

    uncovered_acceptance_criteria: list[str] = Field(
        default_factory=list,
    )

    recommendations: list[str] = Field(
        default_factory=list,
    )

    approved_for_final_output: bool = False

    created_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True,
    )
