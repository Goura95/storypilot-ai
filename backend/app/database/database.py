from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

DATABASE_URL = "sqlite:///./storypilot.db"


# ============================================================
# DATABASE ENGINE
# ============================================================

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
)


# ============================================================
# DATABASE SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ============================================================
# BASE MODEL
# ============================================================

Base = declarative_base()


def ensure_story_schema():
    """Add additive columns needed by newer application versions."""

    inspector = inspect(engine)

    if "stories" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("stories")
    }

    if "story_data" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE stories "
                    "ADD COLUMN story_data TEXT"
                )
            )


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
