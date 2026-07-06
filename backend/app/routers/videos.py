from fastapi import APIRouter, Query
from app.data.videos import videos, video_categories

router = APIRouter()


@router.get("/categories")
async def list_categories():
    """获取视频分类"""
    return {"categories": video_categories}


@router.get("")
async def list_videos(category: str = Query(None, description="筛选分类")):
    """获取视频列表"""
    if category and category != "全部":
        result = [v for v in videos if v["category"] == category]
    else:
        result = videos

    featured = next((v for v in result if v["isFeatured"]), None)
    filtered = [v for v in result if not v["isFeatured"]]

    return {
        "featured": featured,
        "videos": filtered,
        "total": len(result)
    }


@router.get("/{video_id}")
async def get_video(video_id: str):
    """获取视频详情"""
    for v in videos:
        if v["id"] == video_id:
            # 相关推荐（同分类）
            related = [r for r in videos if r["id"] != video_id and r["category"] == v["category"]][:4]
            return {"video": v, "related": related}
    return {"error": "视频不存在"}, 404