from fastapi import APIRouter, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from app.models.schemas import ChatRequest, ChatResponse
from app.services.ai_chat import call_ai_api
from app.services.tts_service import synthesize_speech, AUDIO_DIR
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """AI 数字人问答 - 调用本地 Ollama qwen3.5"""
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
            "火候怎么掌握？",
            "有什么减脂菜推荐？",
            "鸡蛋能做什么菜？"
        ]
    }


class TTSRequest(BaseModel):
    """语音合成请求"""
    text: str


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    """文本转语音 - 返回可播放的 mp3 文件名

    前端拿到 filename 后，用 wx.createInnerAudioContext 播放：
      audio.src = BASE_URL + '/chat/tts-file/' + filename
    """
    filename = await synthesize_speech(req.text)
    if filename:
        return {"success": True, "filename": filename, "url": f"/api/chat/tts-file/{filename}"}
    return {"success": False, "error": "语音合成失败"}


@router.get("/tts-file/{filename}")
async def get_tts_file(filename: str):
    """获取 TTS 音频文件"""
    # 防止路径穿越
    safe_name = os.path.basename(filename)
    filepath = os.path.join(AUDIO_DIR, safe_name)
    if not os.path.exists(filepath):
        return {"error": "文件不存在"}, 404
    return FileResponse(filepath, media_type="audio/mpeg", filename=safe_name)
