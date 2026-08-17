import sqlite3
from pathlib import Path


# ============================================================
# DATABASE PATH
# ============================================================

DATABASE_PATH = Path("storypilot.db")


# ============================================================
# NEW STORY COLUMNS
# ============================================================

NEW_COLUMNS = {
    "assumptions": "TEXT",
    "dependencies": "TEXT",
    "technical_analysis": "TEXT",
    "story_point_reason": "TEXT",
    "complexity": "TEXT",
    "estimation_factors": "TEXT",
    "should_split": "INTEGER DEFAULT 0",
    "split_reason": "TEXT",
    "overall_risk_level": "TEXT",
    "risk_summary": "TEXT",
    "risks": "TEXT",
    "quality_review": "TEXT",
    "quality_score": "INTEGER DEFAULT 0",
    "approved_for_final_output": "INTEGER DEFAULT 0",
}


# ============================================================
# MIGRATION
# ============================================================

def migrate_story_table():

    if not DATABASE_PATH.exists():

        print(
            f"Database not found: {DATABASE_PATH}"
        )

        print(
            "Start the application first so the database "
            "is created."
        )

        return

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    cursor = connection.cursor()

    try:

        # ====================================================
        # CHECK STORIES TABLE
        # ====================================================

        cursor.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type='table'
            AND name='stories'
            """
        )

        table = cursor.fetchone()

        if not table:

            print(
                "stories table does not exist."
            )

            print(
                "Start the application first."
            )

            return

        # ====================================================
        # GET EXISTING COLUMNS
        # ====================================================

        cursor.execute(
            "PRAGMA table_info(stories)"
        )

        existing_columns = {
            row[1]
            for row in cursor.fetchall()
        }

        # ====================================================
        # ADD MISSING COLUMNS
        # ====================================================

        added_columns = []

        for column_name, column_type in NEW_COLUMNS.items():

            if column_name in existing_columns:

                print(
                    f"[EXISTS] {column_name}"
                )

                continue

            sql = (
                f"ALTER TABLE stories "
                f"ADD COLUMN {column_name} "
                f"{column_type}"
            )

            cursor.execute(
                sql
            )

            added_columns.append(
                column_name
            )

            print(
                f"[ADDED] {column_name}"
            )

        # ====================================================
        # COMMIT
        # ====================================================

        connection.commit()

        print()
        print(
            "=================================================="
        )
        print(
            "StoryPilot AI database migration completed."
        )
        print(
            "=================================================="
        )

        if added_columns:

            print(
                "Added columns:"
            )

            for column in added_columns:

                print(
                    f"  - {column}"
                )

        else:

            print(
                "No new columns were required."
            )

    except Exception as exc:

        connection.rollback()

        print()
        print(
            "Database migration failed:"
        )

        print(
            exc
        )

        raise

    finally:

        connection.close()


# ============================================================
# RUN MIGRATION
# ============================================================

if __name__ == "__main__":

    migrate_story_table()