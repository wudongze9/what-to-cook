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


def match_top_dishes(selected_ingredients: list, top_n: int = 3, category: str = None, spice_level: str = None) -> list[dict]:
    """返回 Top N 个匹配菜品"""
    selected_names = [i["name"] if isinstance(i, dict) else i for i in selected_ingredients]

    # 按菜系筛选
    candidate = dishes
    if category and category not in ("全部", "all"):
        candidate = [d for d in dishes if d.get("category") == category or d.get("cuisine") == category]

    # 按辣度筛选
    if spice_level and spice_level != "all":
        spiced = [d for d in candidate if d.get("spiceLevel") == spice_level]
        if spiced:
            candidate = spiced

    # 无候选则放宽辣度
    if not candidate:
        candidate = dishes
        if category and category not in ("全部", "all"):
            candidate = [d for d in dishes if d.get("category") == category or d.get("cuisine") == category]

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


def perform_shuffle(
    category: str = None,
    ingredient_count: int = 3,
    ingredient_type: str = "all",
    selected_ingredients: list = None,
    spice_level: str = None,
) -> dict:
    """执行摇一摇

    :param selected_ingredients: 摇杆机摇出的食材名列表，优先使用
    """
    if selected_ingredients:
        # 使用摇出的食材作为匹配依据
        selected = []
        for name in selected_ingredients:
            found = next((i for i in all_ingredients if i["name"] == name), None)
            if found:
                selected.append(found)
            else:
                selected.append({"name": name, "emoji": "🍽️", "type": "other"})
    else:
        selected = pick_random_ingredients(ingredient_count, ingredient_type)

    matched = match_top_dishes(selected, 3, category, spice_level)

    return {
        "selected_ingredients": selected,
        "matched_dish": matched[0] if matched else None,
        "matched_dishes": matched
    }