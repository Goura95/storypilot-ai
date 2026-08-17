from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from app.database.database import Base


class Story(Base):
    __tablename__ = "stories"

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # USER
    # ========================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # ========================================================
    # BASIC STORY INFORMATION
    # ========================================================

    feature_name = Column(
        String,
        nullable=False,
    )

    title = Column(
        String,
        nullable=False,
    )

    module = Column(
        String,
        nullable=False,
    )

    priority = Column(
        String,
        nullable=False,
    )

    story_type = Column(
        String,
        nullable=False,
    )

    # ========================================================
    # STORY CONTENT
    # ========================================================

    business_value = Column(
        Text,
        nullable=True,
    )

    user_story = Column(
        Text,
        nullable=False,
    )

    # Complete multi-agent story payload (JSON). This keeps advanced sections
    # such as traceability, review findings and business rules version-safe.
    story_data = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # ACCEPTANCE CRITERIA
    # ========================================================

    acceptance_criteria = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # DEFINITION OF DONE
    # ========================================================

    definition_of_done = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # ASSUMPTIONS
    # ========================================================

    assumptions = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # DEPENDENCIES
    # ========================================================

    dependencies = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # QA TEST SCENARIOS
    # ========================================================

    test_scenarios = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # LEGACY TEST CASE STORAGE
    # ========================================================
    #
    # Kept for backward compatibility with the existing
    # database/application.
    #
    # ========================================================

    test_cases = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # TECHNICAL ANALYSIS
    # ========================================================

    technical_analysis = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # STORY POINT ESTIMATION
    # ========================================================

    story_points = Column(
        Integer,
        default=5,
        nullable=False,
    )

    story_point_reason = Column(
        Text,
        nullable=True,
    )

    complexity = Column(
        String,
        nullable=True,
    )

    estimation_factors = Column(
        Text,
        nullable=True,
    )

    should_split = Column(
        Integer,
        default=0,
        nullable=False,
    )

    split_reason = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # RISKS
    # ========================================================

    overall_risk_level = Column(
        String,
        nullable=True,
    )

    risk_summary = Column(
        Text,
        nullable=True,
    )

    risks = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # QUALITY REVIEW
    # ========================================================

    quality_review = Column(
        Text,
        nullable=True,
    )

    quality_score = Column(
        Integer,
        default=0,
        nullable=False,
    )

    approved_for_final_output = Column(
        Integer,
        default=0,
        nullable=False,
    )

    # ========================================================
    # AUDIT
    # ========================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
