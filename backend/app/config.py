"""Runtime configuration shared by the FastAPI application."""
from __future__ import annotations

import logging
import os
import secrets
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

logger = logging.getLogger(__name__)

APP_ENV = os.getenv("APP_ENV", "development").lower()
IS_PRODUCTION = APP_ENV == "production"

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

default_origins = "http://localhost:5173,http://127.0.0.1:5173"
CORS_ORIGINS = [item.strip() for item in os.getenv("CORS_ORIGINS", default_origins).split(",") if item.strip()]
if IS_PRODUCTION and "*" in CORS_ORIGINS:
    raise RuntimeError("Wildcard CORS_ORIGINS is not allowed in production")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "").strip()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
if bool(ADMIN_USERNAME) != bool(ADMIN_PASSWORD):
    raise RuntimeError("ADMIN_USERNAME and ADMIN_PASSWORD must be configured together")
if ADMIN_PASSWORD and len(ADMIN_PASSWORD) < 10:
    raise RuntimeError("ADMIN_PASSWORD must contain at least 10 characters")

