from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import dishes, videos, chat, auth, admin, user_data
from app.services import auth_service

app = FastAPI(
    title="今天吃什么 API",
    description="菜品随机推荐小程序后端服务",
    version="1.0.0"
)

# CORS 允许小程序访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


@app.on_event("startup")
async def startup_event():
    """启动时初始化：建表 + 管理员提示"""
    from app.database import init_db
    init_db()
    auth_service.init_admin_if_empty()


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "今天吃什么"}