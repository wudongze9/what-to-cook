from fastapi import APIRouter, Query
from app.data.dishes import dishes, all_ingredients, get_categories
from app.services.shuffle import perform_shuffle

router = APIRouter()


@router.get("/categories")
async def list_categories():
    """获取菜系分类列表"""
    return {"categories": get_categories()}


@router.get("/ingredients")
async def list_ingredients():
    """获取所有食材"""
    return {"ingredients": all_ingredients}


@router.get("")
async def list_dishes(category: str = Query(None, description="筛选菜系")):
    """获取菜品列表，支持按菜系筛选"""
    if category and category != "全部":
        result = [d for d in dishes if d["category"] == category]
    else:
        result = dishes
    return {"dishes": result, "total": len(result)}


@router.get("/random")
async def random_dish(
    category: str = Query(None, description="筛选菜系"),
    count: int = Query(3, ge=2, le=4, description="食材个数"),
    type: str = Query("all", description="食材类型筛选")
):
    """摇一摇 - 随机推荐菜品"""
    result = perform_shuffle(category=category, ingredient_count=count, ingredient_type=type)
    return result


@router.get("/{dish_id}")
async def get_dish(dish_id: int):
    """获取菜品详情"""
    for dish in dishes:
        if dish["id"] == dish_id:
            return {"dish": dish}
    return {"error": "菜品不存在"}, 404


@router.get("/{dish_id}/steps")
async def get_dish_steps(dish_id: int):
    """获取菜品步骤"""
    for dish in dishes:
        if dish["id"] == dish_id:
            return {"dish_id": dish_id, "steps": dish["steps"], "tips": dish["tips"]}
    return {"error": "菜品不存在"}, 404