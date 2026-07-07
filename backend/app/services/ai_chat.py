"""
AI 对话服务 - 接入本地 Ollama qwen3.5 模型
Ollama 服务地址：http://127.0.0.1:11434
当 Ollama 不可用时降级到本地关键词匹配。
"""
import os
import json
import random
import logging
from app.data.dishes import dishes

logger = logging.getLogger(__name__)

# Ollama 配置
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434/api/chat")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:0.8b")
OLLAMA_TIMEOUT = float(os.environ.get("OLLAMA_TIMEOUT", "120"))

# 系统提示词 - 小厨娘人设 + 菜品库上下文
SYSTEM_PROMPT = """你是小厨娘，一位友好的中文烹饪助手。你的职责：
1. 回答做菜问题（火候、调味、食材处理、刀工等）
2. 根据用户已有食材推荐菜品
3. 提供菜品的详细做法步骤
4. 给出食材替换建议

回答要求：
- 用中文回答，语气亲切友好，可以适当用 emoji
- 简洁实用，不超过 300 字
- 如果用户问某道菜怎么做，给出简洁的步骤
- 如果用户问食材替换，给出常见的替换方案

你内置了 100 道家常菜谱，包括家常菜、川菜、粤菜、湘菜、鲁菜、东北菜、海鲜、汤煲、主食等菜系。
常见菜有：番茄炒蛋、麻婆豆腐、宫保鸡丁、红烧肉、鱼香肉丝、清蒸鲈鱼、白切鸡、回锅肉等。"""


def _build_dish_summary():
    """构建菜品库摘要供 AI 参考"""
    names = [d["name"] for d in dishes[:30]]
    return "、".join(names)


# ==================== 本地降级回复（Ollama 不可用时）====================

reply_rules = [
    {
        "keywords": ["不粘", "粘锅", "粘"],
        "reply": "不粘锅的秘诀来啦！主要有3点：\n1. 锅要烧热再倒油，油温七成热\n2. 食材表面水分要擦干\n3. 翻炒时用锅铲推而不是用力搅\n\n试试看，一定不会粘！"
    },
    {
        "keywords": ["炒出汁", "出汁", "番茄汁", "多汁"],
        "reply": "教你一个小技巧：\n🍅 番茄先在顶部划十字，用开水烫30秒后去皮\n🍳 切小块，更容易出汁\n🔥 中火慢炒，用锅铲按压帮助出汁\n✨ 加一点点糖可以提鲜哦！"
    },
    {
        "keywords": ["嫩", "老", "口感", "柴"],
        "reply": "让肉质变嫩的方法：\n🥩 切法要对：牛肉逆纹切，猪肉顺纹切\n🥛 腌制时加一点淀粉或小苏打\n⏰ 炒制时间不要太长\n🔥 大火快炒，锁住水分"
    },
    {
        "keywords": ["咸", "太咸", "淡", "没味道", "调味"],
        "reply": "调味小窍门：\n🧂 咸了：加一点糖或醋可以中和咸味\n💧 淡了：可以加少许生抽提味\n💡 炒菜时盐要最后放，这样味道更均匀\n❄️ 高汤代替水可以让菜品更有味道"
    },
    {
        "keywords": ["火候", "大火", "小火", "中火"],
        "reply": "火候掌握口诀：\n🔥 大火：适合快炒、爆炒、收汁，保持食材脆嫩\n⏳ 小火：适合炖煮、熬汤、炒糖色，慢慢入味\n🌡️ 中火：适合煎制、日常炒菜\n\n记住：热锅凉油不粘锅！"
    },
    {
        "keywords": ["减肥", "减脂", "低卡", "热量", "健康"],
        "reply": "健康烹饪建议：\n🥗 多用蒸、煮、炖的方式，少油少盐\n🥦 多吃蔬菜和优质蛋白\n🍚 主食可以用粗粮代替白米饭\n🍳 少吃油炸食品，清蒸和水煮是最好的\n\n推荐你试试蒜蓉西兰花和清蒸鲈鱼，低卡又美味！"
    },
    {
        "keywords": ["刀工", "切", "切丝", "切块", "切丁"],
        "reply": "切菜小技巧：\n🔪 切丝：先切片再切丝，食材要稳定不滑动\n🧅 切洋葱不流泪：洋葱放冰箱冷藏10分钟再切\n🥔 切土豆丝：切好后泡水去淀粉，炒出来才脆\n🔪 切肉：肉微冻状态最好切，可以先放冰箱冻20分钟"
    },
    {
        "keywords": ["保存", "储存", "保鲜", "放多久"],
        "reply": "食材保鲜小知识：\n🥬 绿叶菜：用厨房纸包裹，放保鲜袋冷藏，3-5天\n🥚 鸡蛋：大头朝上放，冷藏可保存3-4周\n🥩 生肉：分装小份冷冻，一个月内用完\n🍄 蘑菇：用纸袋装，不要用塑料袋，冷藏5-7天"
    }
]

default_replies = [
    "这个问题很好！你可以试着摇一摇，看看今天适合做什么菜~ 如果有具体做菜的问题，随时问我哦！",
    "嗯，让我想想... 你可以告诉我想做什么菜，我可以给你详细的步骤指导！",
    "我是小厨娘，基本的做菜问题都可以回答哦~ 试试问我关于火候、调味、食材处理的问题吧！"
]


def get_ai_reply(user_message: str) -> str:
    """本地关键词匹配回复（降级用）"""
    for rule in reply_rules:
        for keyword in rule["keywords"]:
            if keyword in user_message:
                return rule["reply"]

    # 菜品名匹配
    for dish in dishes:
        if dish["name"] in user_message:
            steps_text = f"【{dish['name']}】的做法：\n\n"
            for i, step in enumerate(dish["steps"]):
                steps_text += f"{i + 1}. {step['title']}（{step['time']}分钟）\n   {step['desc']}\n\n"
            steps_text += f"💡 小贴士：{dish['tips']}"
            return steps_text

    return random.choice(default_replies)


# ==================== Ollama 调用 ====================

async def call_ai_api(user_message: str, context: list[dict] = None) -> str:
    """调用本地 Ollama qwen3.5 模型，失败时降级到本地匹配"""
    try:
        import httpx
    except ImportError:
        logger.warning("httpx 未安装，降级到本地匹配")
        return get_ai_reply(user_message)

    # 构建消息列表
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if context:
        # 取最近 6 条上下文
        for msg in context[-6:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "think": False,  # 关闭 qwen3.5 思考模式，直接返回 content
        "options": {
            "temperature": 0.7,
            "num_predict": 400,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT, trust_env=False) as client:
            resp = await client.post(OLLAMA_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data.get("message", {}).get("content", "").strip()
            if content:
                return content
            logger.warning("Ollama 返回空 content，降级到本地匹配")
            return get_ai_reply(user_message)
    except Exception as e:
        logger.warning(f"Ollama 调用失败：{e}，降级到本地匹配")
        return get_ai_reply(user_message)
