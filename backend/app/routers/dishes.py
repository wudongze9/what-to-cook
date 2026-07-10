from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from app import database as db

router = APIRouter()


class ShuffleRequest(BaseModel):
    """摇一摇请求 - 携带摇杆机摇出的食材"""
    selected_ingredients: list[str] = []
    category: Optional[str] = None
    spice_level: Optional[str] = None
    excluded_ingredients: list[str] = []


@router.get("/categories")
async def list_categories():
    """获取菜系分类列表"""
    cats = db.get_all_categories()
    return {"categories": ["全部"] + cats}


@router.get("/cuisines")
async def list_cuisines():
    """获取菜系列表（含英文 key 与中文名）"""
    return {"cuisines": db.get_all_cuisines()}


@router.get("/tags")
async def list_tags():
    """获取所有菜品标签"""
    return {"tags": db.get_all_tags()}


@router.get("/ingredients")
async def list_ingredients():
    """获取所有食材"""
    return {"ingredients": db.get_all_ingredients()}


@router.get("/ingredient-types")
async def list_ingredient_types():
    """获取食材类型列表"""
    return {"types": db.get_ingredient_types()}


@router.get("")
async def list_dishes(category: str = Query(None, description="筛选菜系")):
    """获取菜品列表，支持按菜系筛选"""
    result = db.get_dishes(category)
    return {"dishes": result, "total": len(result)}


@router.get("/random")
async def random_dish(
    category: str = Query(None, description="筛选菜系"),
    count: int = Query(3, ge=2, le=4, description="食材个数"),
    type: str = Query("all", description="食材类型筛选")
):
    """摇一摇 - 随机推荐菜品（GET 兜底，后端自己抽食材）"""
    selected = db.pick_random_ingredients(count, type)
    selected_names = [i['name'] for i in selected]
    matched = db.match_dishes_by_ingredients(selected_names, 3, category)
    return {
        "selected_ingredients": selected,
        "matched_dish": matched[0] if matched else None,
        "matched_dishes": matched
    }


@router.post("/random")
async def random_dish_with_ingredients(req: ShuffleRequest):
    """摇一摇 - 使用摇杆机摇出的食材匹配菜品

    前端把摇杆机摇出的食材名列表传过来，后端基于这些食材匹配菜品，
    保证用户看到的食材和推荐菜品的食材一致。
    """
    matched = db.match_dishes_by_ingredients(
        ingredient_names=req.selected_ingredients,
        category=req.category,
        spice_level=req.spice_level,
        excluded_ingredients=req.excluded_ingredients,
    )
    relaxed_filters = []
    if not matched and req.spice_level and req.spice_level != 'all':
        matched = db.match_dishes_by_ingredients(
            ingredient_names=req.selected_ingredients,
            category=req.category,
            spice_level=None,
            excluded_ingredients=req.excluded_ingredients,
        )
        if matched:
            relaxed_filters.append('spice_level')
    if not matched and req.category and req.category not in ('全部', 'all'):
        matched = db.match_dishes_by_ingredients(
            ingredient_names=req.selected_ingredients,
            category=None,
            spice_level=None,
            excluded_ingredients=req.excluded_ingredients,
        )
        if matched:
            relaxed_filters.append('category')
    # 同时返回摇出的食材详情
    all_ings = db.get_all_ingredients()
    ing_map = {i['name']: i for i in all_ings}
    selected = [ing_map.get(name, {'name': name, 'emoji': '🍽️', 'type': 'other'})
                for name in req.selected_ingredients]

    return {
        "selected_ingredients": selected,
        "matched_dish": matched[0] if matched else None,
        "matched_dishes": matched,
        "match_meta": {"relaxed_filters": relaxed_filters}
    }


@router.get("/{dish_id}")
async def get_dish(dish_id: int):
    """获取菜品详情"""
    dish = db.get_dish_detail(dish_id)
    if dish:
        return {"dish": dish}
    return {"error": "菜品不存在"}, 404


@router.get("/{dish_id}/steps")
async def get_dish_steps(dish_id: int):
    """获取菜品步骤"""
    result = db.get_dish_steps(dish_id)
    if result:
        return result
    return {"error": "菜品不存在"}, 404
