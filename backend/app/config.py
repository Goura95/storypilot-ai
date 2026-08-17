import os

from dotenv import load_dotenv


load_dotenv()


# ============================================================
# API KEYS
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# llama-3.3-70b-versatile was retired from the Groq account used by this
# project. Keep the model selectable per environment so a model retirement
# does not require a code change, and default to a model currently available
# to this API key.
GROQ_STORY_MODEL = os.getenv(
    "GROQ_STORY_MODEL",
    "openai/gpt-oss-120b",
)


# ============================================================
# JWT CONFIGURATION
# ============================================================

JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "storypilot-development-secret-change-this",
)

JWT_ALGORITHM = "HS256"

JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
