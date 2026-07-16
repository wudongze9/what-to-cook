from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from contextlib import asynccontextmanager
from app.routers import dishes, videos, chat, auth, admin, user_data
from app.services import auth_service
from app.config import CORS_ORIGINS
from app.database import get_conn
from app.http import (
    RateLimitMiddleware, RequestContextMiddleware,
    http_exception_handler, validation_exception_handler,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    from app.database import init_db
    init_db()
    auth_service.init_admin_if_empty()
    yield

app = FastAPI(
    title="今天吃什么 API",
    description="菜品随机推荐小程序后端服务",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestContextMiddleware)

UPLOAD_DIR = Path(__file__).resolve().parent / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Browser-based admin console CORS. Native Mini Program requests are not
# browser CORS requests, but the same API is shared with admin-web.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(dishes.router, prefix="/api/dishes", tags=["菜品"])
app.include_router(videos.router, prefix="/api/videos", tags=["视频"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI问答"])
app.include_router(auth.router, prefix="/api/auth", tags=["用户认证"])
app.include_router(admin.router, prefix="/api/admin", tags=["管理员"])
app.include_router(user_data.router, prefix="/api/user", tags=["用户数据"])

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "今天吃什么"}


@app.get("/api/health/live")
async def health_live():
    return {"status": "ok"}


@app.get("/api/health/ready")
async def health_ready():
    with get_conn() as conn:
        conn.execute("SELECT 1").fetchone()
    return {"status": "ok", "database": "ready"}
