"""Small DB-API compatibility boundary backed by SQLAlchemy connections.

The application can keep its existing parameterized SQL while the connection URL
selects SQLite for local work or PostgreSQL for production.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Iterable

from sqlalchemy import create_engine

from app.config import DATABASE_URL, IS_POSTGRES


engine = create_engine(DATABASE_URL, pool_pre_ping=True)
_SERIAL_TABLES = {
    "categories", "ingredient_types", "ingredients", "dishes", "dish_ingredients",
    "dish_steps", "users", "user_favorites", "user_history", "admin_audit_logs",
}


class CursorAdapter:
    def __init__(self, result=None, *, lastrowid=None):
        self._result = result
        self.lastrowid = lastrowid if lastrowid is not None else getattr(result, "lastrowid", None)
        self.rowcount = getattr(result, "rowcount", 0)

    def fetchone(self):
        if self._result is None:
            return None
        return self._result.mappings().fetchone()

    def fetchall(self):
        if self._result is None:
            return []
        return self._result.mappings().fetchall()


def _postgres_sql(sql: str) -> tuple[str, bool]:
    statement = sql.strip()
    ignored = bool(re.match(r"INSERT\s+OR\s+IGNORE\s+INTO", statement, re.I))
    if ignored:
        statement = re.sub(r"INSERT\s+OR\s+IGNORE\s+INTO", "INSERT INTO", statement, count=1, flags=re.I)
    statement = statement.replace("datetime('now','localtime')", "CURRENT_TIMESTAMP")
    statement = statement.replace("?", "%s")
    match = re.match(r"INSERT\s+INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)", statement, re.I)
    returns_id = bool(match and match.group(1).lower() in _SERIAL_TABLES)
    if ignored:
        statement += " ON CONFLICT DO NOTHING"
    if returns_id:
        statement += " RETURNING id"
    return statement, returns_id


class ConnectionAdapter:
    def __init__(self):
        self._context = None
        self._connection = None

    def __enter__(self):
        self._context = engine.begin()
        self._connection = self._context.__enter__()
        if not IS_POSTGRES:
            self._connection.exec_driver_sql("PRAGMA foreign_keys = ON")
        return self

    def __exit__(self, exc_type, exc, traceback):
        return self._context.__exit__(exc_type, exc, traceback)

    def execute(self, sql: str, parameters: Iterable[Any] | None = None):
        params = tuple(parameters or ())
        statement, returns_id = _postgres_sql(sql) if IS_POSTGRES else (sql, False)
        result = self._connection.exec_driver_sql(statement, params)
        if returns_id:
            row = result.fetchone()
            return CursorAdapter(lastrowid=row[0] if row else None)
        return CursorAdapter(result)

    def executemany(self, sql: str, parameters: Iterable[Iterable[Any]]):
        statement, _ = _postgres_sql(sql) if IS_POSTGRES else (sql, False)
        # RETURNING is not useful for bulk operations and some drivers reject it.
        statement = re.sub(r"\s+RETURNING\s+id\s*$", "", statement, flags=re.I)
        values = [tuple(item) for item in parameters]
        if not values:
            return CursorAdapter()
        return CursorAdapter(self._connection.exec_driver_sql(statement, values))

    def executescript(self, script: str):
        if IS_POSTGRES:
            raise RuntimeError("PostgreSQL schema changes must be applied with Alembic")
        return self._connection.connection.driver_connection.executescript(script)


def get_connection() -> ConnectionAdapter:
    return ConnectionAdapter()


def assert_schema_ready() -> None:
    with get_connection() as conn:
        try:
            conn.execute("SELECT 1 FROM categories LIMIT 1").fetchone()
        except Exception as exc:
            if IS_POSTGRES:
                raise RuntimeError("PostgreSQL schema is missing; run `alembic upgrade head`") from exc
            raise
