"""
用户数据路由 - 收藏与历史
- POST   /favorites          添加收藏
- DELETE /favorites/{dish_id} 取消收藏
- GET    /favorites          收藏列表
- GET    /favorites/{dish_id}/check  检查是否已收藏
- POST   /history            添加历史
- GET    /history            历史列表
- DELETE /history            清空历史
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from app.deps import get_current_user
from app import database as db
from app.models.schemas import FavoriteRequest
from app.models.schemas import ShoppingListRequest, UserSyncRequest

router = APIRouter()


@router.get("/favorites")
async def list_favorites(user: dict = Depends(get_current_user)):
    """获取我的收藏列表"""
    return {"favorites": db.get_user_favorites(user["id"])}


@router.post("/favorites")
async def add_favorite(req: FavoriteRequest, user: dict = Depends(get_current_user)):
    """添加收藏"""
    db.add_user_favorite(user["id"], req.dish_id)
    return {"message": "已收藏", "favorited": True}


@router.delete("/favorites/{dish_id}")
async def remove_favorite(dish_id: int, user: dict = Depends(get_current_user)):
    """取消收藏"""
    db.remove_user_favorite(user["id"], dish_id)
    return {"message": "已取消收藏", "favorited": False}


@router.get("/favorites/{dish_id}/check")
async def check_favorite(dish_id: int, user: dict = Depends(get_current_user)):
    """检查是否已收藏"""
    return {"favorited": db.is_user_favorited(user["id"], dish_id)}


@router.post("/history")
async def add_history(req: FavoriteRequest, user: dict = Depends(get_current_user)):
    """添加推荐历史"""
    db.add_user_history(user["id"], req.dish_id)
    return {"message": "已记录"}


@router.get("/history")
async def list_history(user: dict = Depends(get_current_user)):
    """获取推荐历史"""
    return {"history": db.get_user_history(user["id"])}


@router.delete("/history")
async def clear_history(user: dict = Depends(get_current_user)):
    """清空推荐历史"""
    db.clear_user_history(user["id"])
    return {"message": "历史已清空"}


@router.get("/shopping-list")
async def get_shopping_list(user: dict = Depends(get_current_user)):
    return {"items": db.get_user_shopping_list(user["id"])}


@router.put("/shopping-list")
async def replace_shopping_list(
    req: ShoppingListRequest,
    user: dict = Depends(get_current_user),
):
    items = [item.model_dump() for item in req.items]
    return {"items": db.replace_user_shopping_list(user["id"], items)}


@router.post("/sync")
async def sync_user_data(req: UserSyncRequest, user: dict = Depends(get_current_user)):
    return db.sync_user_data(
        user["id"], req.favorite_ids, req.history_ids,
        [item.model_dump() for item in req.shopping_items],
    )
