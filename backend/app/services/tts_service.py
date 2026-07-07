"""
TTS 语音合成服务 - 使用 edge-tts（微软 Edge 免费 TTS）
生成的 mp3 文件保存在 static/audio/ 目录，通过 HTTP 返回给小程序。
"""
import os
import hashlib
import logging
import asyncio

logger = logging.getLogger(__name__)

# 音频文件保存目录
AUDIO_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'audio')
os.makedirs(AUDIO_DIR, exist_ok=True)

# 中文女声（小厨娘形象）
TTS_VOICE = "zh-CN-XiaoyiNeural"  # 年轻女声，活泼亲切
TTS_RATE = "+5%"  # 语速略快，更活泼
TTS_VOLUME = "+0%"

# 文本长度限制（避免过长文本生成耗时）
MAX_TEXT_LENGTH = 500


def _file_key(text: str) -> str:
    """根据文本内容生成文件名 hash"""
    return hashlib.md5(text.encode('utf-8')).hexdigest()[:16]


async def synthesize_speech(text: str) -> str | None:
    """将文本合成为语音，返回 mp3 文件名

    Returns:
        成功返回文件名（如 abc123.mp3），失败返回 None
    """
    if not text or not text.strip():
        return None

    # 长度截断
    text = text.strip()[:MAX_TEXT_LENGTH]
    file_key = _file_key(text)
    filename = f"{file_key}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    # 已生成过的直接返回（缓存）
    if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
        logger.info(f"TTS 缓存命中：{filename}")
        return filename

    try:
        import edge_tts
        communicate = edge_tts.Communicate(
            text=text,
            voice=TTS_VOICE,
            rate=TTS_RATE,
            volume=TTS_VOLUME,
        )
        await communicate.save(filepath)
        logger.info(f"TTS 合成成功：{filename}（{len(text)} 字）")
        return filename
    except Exception as e:
        logger.error(f"TTS 合成失败：{e}")
        return None
