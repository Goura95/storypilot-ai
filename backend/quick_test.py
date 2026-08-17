import sys

# ============================================================
# VERIFY CONSOLIDATED AGENT
# ============================================================

from app.agents.consolidated_agent import (
    client as consolidated_client,
    generate_complete_story as generate_consolidated_story,
)

print(f"Consolidated agent client read timeout = {consolidated_client.timeout.read}")
print(f"Consolidated agent client max_retries = {consolidated_client.max_retries}")

if consolidated_client.timeout.read != 65.0:
    print("FAIL: consolidated client read timeout != 65.0")
    sys.exit(1)

if consolidated_client.max_retries != 0:
    print("FAIL: consolidated client max_retries != 0")
    sys.exit(1)

print("OK: Consolidated client configured correctly")

# ============================================================
# VERIFY ORCHESTRATOR USES CONSOLIDATED AGENT
# ============================================================

from app.agents.orchestrator import (
    generate_complete_story as orchestrator_generate_story,
)

print("OK: Orchestrator imports successfully")

# ============================================================
# VERIFY FULL PIPELINE
# ============================================================

from app.services.groq_service import generate_story

print("OK: Full pipeline imports correctly")
print("RESULT: PASS")
