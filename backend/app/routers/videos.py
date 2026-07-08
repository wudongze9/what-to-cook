from fastapi import APIRouter, Query, Depends, HTTPException
from app.data.videos import videos as legacy_videos, video_categories
from app.database import (
    get_videos_by_dish, get_video_by_id, get_all_videos,
    get_video_sources, add_dish_video, delete_dish_video
)
from app.deps import require_admin

router = APIRouter()


@router.get("/categories")
async def list_categories():
    """获取视频分类（兼容旧版）"""
    return {"categories": video_categories}


@router.get("/sources/list")
async def list_sources():
    """获取所有视频来源平台"""
    return {"sources": get_video_sources()}


@router.get("/all/list")
async def list_all_videos(category: str = Query(None)):
    """获取所有菜品教学视频（新版，可按菜系筛选）"""
    result = get_all_videos(category)
    return {"videos": result, "total": len(result)}


@router.get("/dish/{dish_id}")
async def get_dish_videos(dish_id: int):
    """按菜品 ID 查询所有教学视频"""
    result = get_videos_by_dish(dish_id)
    return {"dishId": dish_id, "videos": result, "total": len(result)}


@router.post("/admin/add")
async def admin_add_video(data: dict = Depends(require_admin)):
    """管理员新增视频"""
    if not data.get("dish_id") or not data.get("title"):
        raise HTTPException(status_code=400, detail="dish_id 和 title 必填")
    return add_dish_video(data)


@router.delete("/admin/{video_id}")
async def admin_delete_video(video_id: str = Depends(require_admin)):
    """管理员删除视频"""
    ok = delete_dish_video(video_id)
    if not ok:
        raise HTTPException(status_code=404, detail="视频不存在")
    return {"message": "已删除"}


@router.get("")
async def list_videos(category: str = Query(None)):
    """视频列表（兼容旧版 mock 视频）"""
    if category and category != "全部":
        result = [v for v in legacy_videos if v["category"] == category]
    else:
        result = legacy_videos
    featured = next((v for v in result if v["isFeatured"]), None)
    filtered = [v for v in result if not v["isFeatured"]]
    return {"featured": featured, "videos": filtered, "total": len(result)}


@router.get("/{video_id}")
async def get_video(video_id: str):
    """获取视频详情：优先查 dish_videos 表，找不到再查旧版 videos 列表"""
    db_result = get_video_by_id(video_id)
    if db_result:
        return db_result
    for v in legacy_videos:
        if v["id"] == video_id:
            related = [r for r in legacy_videos if r["id"] != video_id and r["category"] == v["category"]][:4]
            return {"video": v, "related": related, "source": "legacy"}
    raise HTTPException(status_code=404, detail="视频不存在")
