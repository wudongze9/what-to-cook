"""Runtime configuration shared by the FastAPI application."""
from __future__ import annotations

import logging
import os
import secrets
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BASE_DIR.parent
# Keep one shared configuration file at the repository root.  The legacy
# backend/.env remains an optional local override for existing installations.
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(BASE_DIR / ".env", override=True)

logger = logging.getLogger(__name__)

APP_ENV = os.getenv("APP_ENV", "development").lower()
IS_PRODUCTION = APP_ENV == "production"
DEFAULT_SQLITE_PATH = BASE_DIR / "whattocook.db"
LEGACY_DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(DEFAULT_SQLITE_PATH))).resolve()
DATABASE_URL = os.getenv("DATABASE_URL", "").strip() or f"sqlite:///{LEGACY_DATABASE_PATH.as_posix()}"
IS_POSTGRES = DATABASE_URL.startswith(("postgresql://", "postgresql+psycopg://"))
if IS_PRODUCTION and not IS_POSTGRES:
    raise RuntimeError("Production DATABASE_URL must use PostgreSQL")
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() in {"1", "true", "yes"}
if IS_PRODUCTION and DEMO_MODE:
    raise RuntimeError("DEMO_MODE must be disabled in production")

JWT_SECRET = os.getenv("JWT_SECRET", "").strip()
if not JWT_SECRET:
    if IS_PRODUCTION:
        raise RuntimeError("JWT_SECRET is required in production")
    JWT_SECRET = secrets.token_urlsafe(48)
    logger.warning("JWT_SECRET is not configured; using an ephemeral development key")
elif IS_PRODUCTION and len(JWT_SECRET) < 32:
    raise RuntimeError("JWT_SECRET must contain at least 32 characters in production")

JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "72"))
WX_APPID = os.getenv("WX_APPID", "").strip()
WX_SECRET = os.getenv("WX_SECRET", "").strip()
if IS_PRODUCTION and (not WX_APPID or not WX_SECRET):
    raise RuntimeError("WX_APPID and WX_SECRET are required in production")

default_origins = "http://localhost:5175,http://127.0.0.1:5175"
CORS_ORIGINS = [item.strip() for item in os.getenv("CORS_ORIGINS", default_origins).split(",") if item.strip()]
if IS_PRODUCTION and "*" in CORS_ORIGINS:
    raise RuntimeError("Wildcard CORS_ORIGINS is not allowed in production")

AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama").strip().lower()
AI_API_BASE = os.getenv("AI_API_BASE", "").strip()
AI_API_KEY = os.getenv("AI_API_KEY", "").strip()
AI_MODEL = os.getenv("AI_MODEL", os.getenv("OLLAMA_MODEL", "qwen3.5:0.8b")).strip()
if AI_PROVIDER not in {"ollama", "openai_compatible", "rules"}:
    raise RuntimeError("AI_PROVIDER must be ollama, openai_compatible, or rules")
if IS_PRODUCTION and AI_PROVIDER == "openai_compatible" and (not AI_API_BASE or not AI_API_KEY):
    raise RuntimeError("AI_API_BASE and AI_API_KEY are required for the production AI provider")

AUTH_RATE_LIMIT = int(os.getenv("AUTH_RATE_LIMIT", "10"))
CHAT_RATE_LIMIT = int(os.getenv("CHAT_RATE_LIMIT", "30"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local").strip().lower()
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "").strip()
S3_BUCKET = os.getenv("S3_BUCKET", "").strip()
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "").strip()
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "").strip()
S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL", "").strip().rstrip("/")
if STORAGE_BACKEND not in {"local", "s3"}:
    raise RuntimeError("STORAGE_BACKEND must be local or s3")
if IS_PRODUCTION and STORAGE_BACKEND != "s3":
    raise RuntimeError("Production STORAGE_BACKEND must be s3")
if STORAGE_BACKEND == "s3" and not all((S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_BASE_URL)):
    raise RuntimeError("S3_BUCKET, credentials, and S3_PUBLIC_BASE_URL are required for S3 storage")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "").strip()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
if bool(ADMIN_USERNAME) != bool(ADMIN_PASSWORD):
    raise RuntimeError("ADMIN_USERNAME and ADMIN_PASSWORD must be configured together")
if ADMIN_PASSWORD and len(ADMIN_PASSWORD) < 10:
    raise RuntimeError("ADMIN_PASSWORD must contain at least 10 characters")
