"""
摇一摇核心算法 - 从 miniprogram/utils/shuffle.js 迁移
"""
import random
from app.data.dishes import dishes, all_ingredients


def pick_random_ingredients(count: int = 3, ingredient_type: str = "all") -> list[dict]:
    """随机抽取 n 个不重复的食材"""
    pool = all_ingredients if not ingredient_type or ingredient_type == "all" else [i for i in all_ingredients if i.get("type") == ingredient_type]
    shuffled = pool.copy()
    random.shuffle(shuffled)
    return shuffled[:count]


def match_top_dishes(selected_ingredients: list[dict], top_n: int = 3, category: str = None) -> list[dict]:
    """返回 Top N 个匹配菜品"""
    selected_names = [i["name"] for i in selected_ingredients]

    # 按菜系筛选
    candidate = dishes
    if category and category != "全部":
        candidate = [d for d in dishes if d["category"] == category]

    scored = []
    for dish in candidate:
        score = 0
        for ing in dish["ingredients"]:
            if ing in selected_names:
                score += 1
        extra_count = len(dish["ingredients"]) - score
        adjusted_score = score - extra_count * 0.3
        scored.append({"dish": dish, "score": adjusted_score})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return [s["dish"] for s in scored[:top_n]]


def perform_shuffle(category: str = None, ingredient_count: int = 3, ingredient_type: str = "all") -> dict:
    """执行摇一摇"""
    selected = pick_random_ingredients(ingredient_count, ingredient_type)
    matched = match_top_dishes(selected, 3, category)

    return {
        "selected_ingredients": selected,
        "matched_dish": matched[0] if matched else None,
        "matched_dishes": matched
    }