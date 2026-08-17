from pydantic import BaseModel


# ============================================================
# DISTRIBUTION
# ============================================================

class AnalyticsDistribution(BaseModel):
    name: str
    count: int
    percentage: float


# ============================================================
# STORIES OVER TIME
# ============================================================

class StoriesOverTime(BaseModel):
    date: str
    count: int


# ============================================================
# QA COVERAGE
# ============================================================

class QACoverage(BaseModel):
    total_acceptance_criteria: int
    total_definition_of_done: int
    total_test_scenarios: int
    total_test_steps: int
    average_test_scenarios_per_story: float


# ============================================================
# ANALYTICS RESPONSE
# ============================================================

class AnalyticsResponse(BaseModel):

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    total_stories: int

    total_story_points: int

    average_story_points: float

    total_test_scenarios: int

    total_acceptance_criteria: int

    total_definition_of_done: int

    total_test_steps: int

    # --------------------------------------------------------
    # DISTRIBUTIONS
    # --------------------------------------------------------

    stories_by_priority: list[
        AnalyticsDistribution
    ]

    stories_by_type: list[
        AnalyticsDistribution
    ]

    stories_by_module: list[
        AnalyticsDistribution
    ]

    # --------------------------------------------------------
    # TIME TREND
    # --------------------------------------------------------

    stories_over_time: list[
        StoriesOverTime
    ]

    # --------------------------------------------------------
    # QA
    # --------------------------------------------------------

    qa_coverage: QACoverage