"""Initial PostgreSQL schema.

Revision ID: 20260716_01
Revises: None
"""
from pathlib import Path
from alembic import op

revision = "20260716_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    if op.get_bind().dialect.name != "postgresql":
        return
    schema = Path(__file__).resolve().parents[2] / "app" / "data" / "schema_postgres.sql"
    for statement in schema.read_text(encoding="utf-8").split(";"):
        if statement.strip():
            op.execute(statement)


def downgrade():
    if op.get_bind().dialect.name != "postgresql":
        return
    for table in ["dish_videos", "admin_audit_logs", "user_shopping_items", "user_preferences",
                  "user_history", "user_favorites", "dish_steps", "dish_ingredients", "users",
                  "dishes", "ingredients", "ingredient_types", "categories"]:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
