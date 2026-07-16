"""Copy an existing WhatToCook SQLite database into an empty migrated PostgreSQL database."""
from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path

from app.config import IS_POSTGRES
from app.database import get_conn

TABLES = [
    "categories", "ingredient_types", "ingredients", "dishes", "dish_ingredients", "dish_steps",
    "users", "user_favorites", "user_history", "user_preferences", "user_shopping_items",
    "admin_audit_logs", "dish_videos",
]
SERIAL_TABLES = [
    "categories", "ingredient_types", "ingredients", "dishes", "dish_ingredients", "dish_steps",
    "users", "user_favorites", "user_history", "admin_audit_logs",
]


def migrate(source_path: Path) -> dict[str, int]:
    if not IS_POSTGRES:
        raise RuntimeError("DATABASE_URL must point to PostgreSQL")
    if not source_path.is_file():
        raise FileNotFoundError(source_path)
    source = sqlite3.connect(source_path)
    source.row_factory = sqlite3.Row
    counts = {}
    with get_conn() as target:
        occupied = sum(target.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()["c"] for table in TABLES)
        if occupied:
            raise RuntimeError("Target database is not empty; migration aborted without changes")
        for table in TABLES:
            rows = source.execute(f"SELECT * FROM {table}").fetchall()
            counts[table] = len(rows)
            if not rows:
                continue
            columns = list(rows[0].keys())
            sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join('?' for _ in columns)})"
            for row in rows:
                target.execute(sql, tuple(row[column] for column in columns))
        for table in SERIAL_TABLES:
            target.execute(
                f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                f"COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM {table}"
            )
    source.close()
    with get_conn() as target:
        for table, expected in counts.items():
            actual = target.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()["c"]
            if actual != expected:
                raise RuntimeError(f"Count mismatch for {table}: expected {expected}, got {actual}")
    return counts


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="Path to the existing SQLite database")
    args = parser.parse_args()
    for name, count in migrate(args.source).items():
        print(f"{name}: {count}")
