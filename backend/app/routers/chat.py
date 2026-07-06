from fastapi import APIRouter
from app.models.schemas import ChatRequest, ChatResponse
from app.services.ai_chat import call_ai_api

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """AI 数字人问答"""
    reply = await call_ai_api(req.message, req.context)
    return ChatResponse(reply=reply)


@router.get("/quick-questions")
async def quick_questions():
    """获取快捷问题列表"""
    return {
        "questions": [
            "炒菜怎么不粘锅？",
            "番茄怎么炒出汁？",
            "怎么让肉变嫩？",
            "火候怎么掌握？"
        ]
    }