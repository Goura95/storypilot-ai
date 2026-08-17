import json
from collections import Counter
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.story import Story
from app.schemas.analytics import (
    AnalyticsDistribution,
    AnalyticsResponse,
    QACoverage,
    StoriesOverTime,
)
from app.security import get_current_user


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api",
    tags=["Analytics"],
)


# ============================================================
# JSON HELPER
# ============================================================

def parse_json_field(value, default):
    """
    Convert JSON stored as a string in the database
    into a Python object.
    """

    if value is None:
        return default

    if isinstance(value, (list, dict)):
        return value

    if isinstance(value, str):

        try:
            parsed = json.loads(value)

            if isinstance(parsed, type(default)):
                return parsed

            return default

        except (
            json.JSONDecodeError,
            TypeError,
        ):
            return default

    return default


# ============================================================
# PERCENTAGE HELPER
# ============================================================

def calculate_percentage(
    count: int,
    total: int,
) -> float:

    if total == 0:
        return 0.0

    return round(
        (count / total) * 100,
        2,
    )


# ============================================================
# BUILD DISTRIBUTION
# ============================================================

def build_distribution(
    values: list[str],
) -> list[AnalyticsDistribution]:

    if not values:
        return []

    counter = Counter(values)

    total = len(values)

    result = []

    for name, count in counter.most_common():

        result.append(
            AnalyticsDistribution(
                name=name,
                count=count,
                percentage=calculate_percentage(
                    count,
                    total,
                ),
            )
        )

    return result


# ============================================================
# GET ANALYTICS
# ============================================================

@router.get(
    "/analytics",
    response_model=AnalyticsResponse,
)
def get_analytics(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user),
):

    # ========================================================
    # GET CURRENT USER STORIES
    # ========================================================

    stories = (
        db.query(Story)
        .filter(
            Story.user_id == current_user_id
        )
        .order_by(
            Story.created_at.asc()
        )
        .all()
    )

    # ========================================================
    # EMPTY DATABASE
    # ========================================================

    if not stories:

        empty_qa = QACoverage(
            total_acceptance_criteria=0,
            total_definition_of_done=0,
            total_test_scenarios=0,
            total_test_steps=0,
            average_test_scenarios_per_story=0.0,
        )

        return AnalyticsResponse(
            total_stories=0,
            total_story_points=0,
            average_story_points=0.0,
            total_test_scenarios=0,
            total_acceptance_criteria=0,
            total_definition_of_done=0,
            total_test_steps=0,
            stories_by_priority=[],
            stories_by_type=[],
            stories_by_module=[],
            stories_over_time=[],
            qa_coverage=empty_qa,
        )

    # ========================================================
    # SUMMARY COUNTERS
    # ========================================================

    total_stories = len(stories)

    total_story_points = 0

    total_acceptance_criteria = 0

    total_definition_of_done = 0

    total_test_scenarios = 0

    total_test_steps = 0

    # ========================================================
    # DISTRIBUTION DATA
    # ========================================================

    priorities = []

    story_types = []

    modules = []

    # ========================================================
    # STORIES OVER TIME
    # ========================================================

    stories_by_date = Counter()

    # ========================================================
    # PROCESS STORIES
    # ========================================================

    for story in stories:

        # ----------------------------------------------------
        # STORY POINTS
        # ----------------------------------------------------

        total_story_points += (
            story.story_points or 0
        )

        # ----------------------------------------------------
        # PRIORITY
        # ----------------------------------------------------

        priority = (
            story.priority.strip()
            if story.priority
            else "Unknown"
        )

        priorities.append(priority)

        # ----------------------------------------------------
        # STORY TYPE
        # ----------------------------------------------------

        story_type = (
            story.story_type.strip()
            if story.story_type
            else "Unknown"
        )

        story_types.append(story_type)

        # ----------------------------------------------------
        # MODULE
        # ----------------------------------------------------

        module = (
            story.module.strip()
            if story.module
            else "Unknown"
        )

        modules.append(module)

        # ----------------------------------------------------
        # ACCEPTANCE CRITERIA
        # ----------------------------------------------------

        acceptance_criteria = parse_json_field(
            story.acceptance_criteria,
            [],
        )

        if isinstance(
            acceptance_criteria,
            list,
        ):

            total_acceptance_criteria += len(
                acceptance_criteria
            )

        # ----------------------------------------------------
        # DEFINITION OF DONE
        # ----------------------------------------------------

        definition_of_done = parse_json_field(
            story.definition_of_done,
            [],
        )

        if isinstance(
            definition_of_done,
            list,
        ):

            total_definition_of_done += len(
                definition_of_done
            )

        # ----------------------------------------------------
        # TEST SCENARIOS
        # ----------------------------------------------------

        test_scenarios = parse_json_field(
            story.test_scenarios,
            [],
        )

        if isinstance(
            test_scenarios,
            list,
        ):

            total_test_scenarios += len(
                test_scenarios
            )

            # ----------------------------------------------
            # TEST STEPS
            # ----------------------------------------------

            for test_case in test_scenarios:

                if not isinstance(
                    test_case,
                    dict,
                ):
                    continue

                steps = test_case.get(
                    "steps",
                    [],
                )

                if isinstance(
                    steps,
                    list,
                ):

                    total_test_steps += len(
                        steps
                    )

        # ----------------------------------------------------
        # CREATED DATE
        # ----------------------------------------------------

        if story.created_at:

            created_date = story.created_at.strftime(
                "%Y-%m-%d"
            )

            stories_by_date[
                created_date
            ] += 1

    # ========================================================
    # AVERAGE STORY POINTS
    # ========================================================

    average_story_points = round(
        total_story_points / total_stories,
        2,
    )

    # ========================================================
    # AVERAGE TEST SCENARIOS
    # ========================================================

    average_test_scenarios = round(
        total_test_scenarios / total_stories,
        2,
    )

    # ========================================================
    # DISTRIBUTIONS
    # ========================================================

    stories_by_priority = build_distribution(
        priorities
    )

    stories_by_type = build_distribution(
        story_types
    )

    stories_by_module = build_distribution(
        modules
    )

    # ========================================================
    # STORIES OVER TIME
    # ========================================================

    stories_over_time = [
        StoriesOverTime(
            date=date,
            count=count,
        )
        for date, count in sorted(
            stories_by_date.items()
        )
    ]

    # ========================================================
    # QA COVERAGE
    # ========================================================

    qa_coverage = QACoverage(
        total_acceptance_criteria=(
            total_acceptance_criteria
        ),

        total_definition_of_done=(
            total_definition_of_done
        ),

        total_test_scenarios=(
            total_test_scenarios
        ),

        total_test_steps=(
            total_test_steps
        ),

        average_test_scenarios_per_story=(
            average_test_scenarios
        ),
    )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return AnalyticsResponse(

        # ----------------------------------------------------
        # SUMMARY
        # ----------------------------------------------------

        total_stories=total_stories,

        total_story_points=total_story_points,

        average_story_points=average_story_points,

        total_test_scenarios=(
            total_test_scenarios
        ),

        total_acceptance_criteria=(
            total_acceptance_criteria
        ),

        total_definition_of_done=(
            total_definition_of_done
        ),

        total_test_steps=(
            total_test_steps
        ),

        # ----------------------------------------------------
        # DISTRIBUTIONS
        # ----------------------------------------------------

        stories_by_priority=(
            stories_by_priority
        ),

        stories_by_type=(
            stories_by_type
        ),

        stories_by_module=(
            stories_by_module
        ),

        # ----------------------------------------------------
        # TIME
        # ----------------------------------------------------

        stories_over_time=(
            stories_over_time
        ),

        # ----------------------------------------------------
        # QA
        # ----------------------------------------------------

        qa_coverage=qa_coverage,
    )