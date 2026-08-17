"""Fast entry point for StoryPilot's complete story-generation workflow.

The previous implementation made twelve serial Groq requests and waited a
minute between most calls to fit a free-tier token window. That made a single
story take roughly ten minutes. The consolidated agent produces the same
product, BA, QA, technical, risk, estimate, and review sections in one request.
"""

from typing import Any

from app.agents.consolidated_agent import generate_complete_story as _generate_story


def generate_complete_story(
    feature_name: str,
    module: str,
    priority: str,
    story_type: str,
    description: str,
    image_bytes: bytes | None = None,
    image_content_type: str | None = None,
) -> dict[str, Any]:
    """Generate the complete story in one Groq call (target: 20--60 seconds)."""
    return _generate_story(
        feature_name=feature_name,
        module=module,
        priority=priority,
        story_type=story_type,
        description=description,
        image_bytes=image_bytes,
        image_content_type=image_content_type,
    )
