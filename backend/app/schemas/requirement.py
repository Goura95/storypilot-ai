from pydantic import BaseModel, Field, field_validator


# ============================================================
# ACTOR
# ============================================================

class RequirementActor(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
    )

    responsibility: str = Field(
        ...,
        min_length=1,
    )


# ============================================================
# FUNCTIONAL REQUIREMENT
# ============================================================

class FunctionalRequirement(BaseModel):
    requirement: str = Field(
        ...,
        min_length=1,
    )

    priority: str = Field(
        ...,
        min_length=1,
    )


# ============================================================
# VALIDATION RULE
# ============================================================

class ValidationRule(BaseModel):
    rule: str = Field(
        ...,
        min_length=1,
    )

    expected_behavior: str = Field(
        ...,
        min_length=1,
    )


# ============================================================
# SECURITY REQUIREMENT
# ============================================================

class SecurityRequirement(BaseModel):
    requirement: str = Field(
        ...,
        min_length=1,
    )

    expected_behavior: str = Field(
        ...,
        min_length=1,
    )


# ============================================================
# WORKFLOW STEP
# ============================================================

class WorkflowStep(BaseModel):
    step: int

    action: str = Field(
        ...,
        min_length=1,
    )

    expected_result: str = Field(
        ...,
        min_length=1,
    )

    @field_validator("step")
    @classmethod
    def validate_step(
        cls,
        value: int,
    ) -> int:

        if value < 1:
            raise ValueError(
                "Workflow step must be greater than 0."
            )

        return value


# ============================================================
# QA AREA
# ============================================================

class QAArea(BaseModel):
    area: str = Field(
        ...,
        min_length=1,
    )

    reason: str = Field(
        ...,
        min_length=1,
    )


# ============================================================
# ASSUMPTION
# ============================================================

class RequirementAssumption(BaseModel):
    assumption: str = Field(
        ...,
        min_length=1,
    )

    impact: str = Field(
        ...,
        min_length=1,
    )


# ============================================================
# STRUCTURED REQUIREMENT
# ============================================================

class RequirementAnalysis(BaseModel):

    feature_name: str = Field(
        ...,
        min_length=1,
    )

    module: str = Field(
        ...,
        min_length=1,
    )

    summary: str = Field(
        ...,
        min_length=1,
    )

    actors: list[RequirementActor] = Field(
        default_factory=list,
    )

    goal: str = Field(
        ...,
        min_length=1,
    )

    functional_requirements: list[
        FunctionalRequirement
    ] = Field(
        default_factory=list,
    )

    validation_rules: list[
        ValidationRule
    ] = Field(
        default_factory=list,
    )

    security_requirements: list[
        SecurityRequirement
    ] = Field(
        default_factory=list,
    )

    workflow: list[
        WorkflowStep
    ] = Field(
        default_factory=list,
    )

    qa_areas: list[
        QAArea
    ] = Field(
        default_factory=list,
    )

    assumptions: list[
        RequirementAssumption
    ] = Field(
        default_factory=list,
    )

    # ========================================================
    # VALIDATE REQUIRED ANALYSIS
    # ========================================================

    @field_validator(
        "feature_name",
        "module",
        "summary",
        "goal",
    )
    @classmethod
    def validate_required_text(
        cls,
        value: str,
    ) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Required requirement information "
                "cannot be empty."
            )

        return value

    # ========================================================
    # VALIDATE FUNCTIONAL REQUIREMENTS
    # ========================================================

    @field_validator(
        "functional_requirements"
    )
    @classmethod
    def validate_functional_requirements(
        cls,
        value: list[FunctionalRequirement],
    ) -> list[FunctionalRequirement]:

        if not value:
            raise ValueError(
                "At least one functional requirement "
                "must be identified."
            )

        return value

    # ========================================================
    # VALIDATE QA AREAS
    # ========================================================

    @field_validator("qa_areas")
    @classmethod
    def validate_qa_areas(
        cls,
        value: list[QAArea],
    ) -> list[QAArea]:

        if not value:
            raise ValueError(
                "At least one QA area must be identified."
            )

        return value