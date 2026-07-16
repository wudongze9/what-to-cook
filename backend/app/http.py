"""HTTP boundary: request IDs, structured errors, access logging and basic rate limits."""
from __future__ import annotations

import json
import logging
import time
import uuid
from collections import defaultdict, deque

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import AUTH_RATE_LIMIT, CHAT_RATE_LIMIT

logger = logging.getLogger("whattocook.http")


def _error_code(status_code: int) -> str:
    return {400: "BAD_REQUEST", 401: "AUTH_REQUIRED", 403: "FORBIDDEN", 404: "NOT_FOUND",
            409: "CONFLICT", 422: "VALIDATION_ERROR", 429: "RATE_LIMITED"}.get(
        status_code, "INTERNAL_ERROR" if status_code >= 500 else "REQUEST_ERROR"
    )


def error_response(request: Request, status_code: int, message: str, code: str | None = None):
    request_id = getattr(request.state, "request_id", "")
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code or _error_code(status_code), "message": message, "request_id": request_id}},
        headers={"X-Request-ID": request_id},
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        return error_response(request, exc.status_code, str(detail.get("message", detail)), detail.get("code"))
    return error_response(request, exc.status_code, str(detail))


async def validation_exception_handler(request: Request, _exc: RequestValidationError):
    return error_response(request, 422, "请求参数不符合要求", "VALIDATION_ERROR")


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        started = time.perf_counter()
        request.state.request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("unhandled request error", extra={"request_id": request.state.request_id})
            return error_response(request, 500, "服务暂时不可用，请稍后重试")
        response.headers["X-Request-ID"] = request.state.request_id
        logger.info(json.dumps({"request_id": request.state.request_id, "method": request.method,
                                "path": request.url.path, "status": response.status_code,
                                "duration_ms": round((time.perf_counter() - started) * 1000, 2)}, ensure_ascii=False))
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Single-instance guard. Replace its storage with Redis before horizontal scaling."""
    buckets: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        limit = None
        if request.method == "POST" and path in {"/api/auth/login", "/api/auth/register", "/api/auth/wx-login"}:
            limit = AUTH_RATE_LIMIT
        elif request.method == "POST" and path in {"/api/chat", "/api/chat/stream", "/api/chat/tts"}:
            limit = CHAT_RATE_LIMIT
        if limit:
            host = request.client.host if request.client else "unknown"
            bucket = self.buckets[f"{host}:{path}"]
            now = time.monotonic()
            while bucket and bucket[0] <= now - 60:
                bucket.popleft()
            if len(bucket) >= limit:
                return error_response(request, 429, "请求过于频繁，请稍后再试", "RATE_LIMITED")
            bucket.append(now)
        return await call_next(request)
