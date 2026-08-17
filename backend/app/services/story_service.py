import json

from sqlalchemy.orm import Session

from app.models.story import Story


def save_story(
    db: Session,
    user_id: int,
    feature_name: str,
    ai_story: dict,
):
    """
    Save an AI-generated story for the authenticated user.
    """

    acceptance_criteria = ai_story.get(
        "acceptance_criteria",
        [],
    )

    definition_of_done = ai_story.get(
        "definition_of_done",
        [],
    )

    test_scenarios = ai_story.get(
        "test_scenarios",
        [],
    )

    # ----------------------------------------------------------
    # Convert arrays to JSON strings for SQLite
    # ----------------------------------------------------------

    acceptance_criteria_json = json.dumps(
        acceptance_criteria
    )

    definition_of_done_json = json.dumps(
        definition_of_done
    )

    test_scenarios_json = json.dumps(
        test_scenarios
    )

    # ----------------------------------------------------------
    # Create database record
    # ----------------------------------------------------------

    story = Story(
        user_id=user_id,

        feature_name=feature_name,

        title=ai_story.get(
            "title",
            "Untitled Story",
        ),

        module=ai_story.get(
            "module",
            "",
        ),

        priority=ai_story.get(
            "priority",
            "",
        ),

        story_type=ai_story.get(
            "story_type",
            "",
        ),

        business_value=ai_story.get(
            "business_value",
            "",
        ),

        user_story=ai_story.get(
            "user_story",
            "",
        ),

        acceptance_criteria=(
            acceptance_criteria_json
        ),

        definition_of_done=(
            definition_of_done_json
        ),

        test_scenarios=(
            test_scenarios_json
        ),

        test_cases=json.dumps(
            ai_story.get(
                "test_cases",
                [],
            )
        ),

        story_points=ai_story.get(
            "story_points",
            5,
        ),
    )

    # ----------------------------------------------------------
    # Save
    # ----------------------------------------------------------

    db.add(story)

    db.commit()

    db.refresh(story)

    return story