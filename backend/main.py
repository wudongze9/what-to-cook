from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import dishes, videos, chat

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


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "今天吃什么"}