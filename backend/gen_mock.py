"""
前端 Mock 生成脚本：从 dishes-data.json 生成 miniprogram/mock/dishes.js
运行：python gen_mock.py
"""
import json
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), 'app', 'data', 'dishes-data.json')
OUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'miniprogram', 'mock', 'dishes.js')

# 菜系中文名 → 英文 key（与 upgrade_data.py 保持一致）
CUISINE_KEY = {
    '家常菜': 'home', '川菜': 'sichuan', '粤菜': 'cantonese', '湘菜': 'hunan',
    '鲁菜': 'shandong', '苏菜': 'jiangsu', '浙菜': 'zhejiang', '闽菜': 'fujian',
    '徽菜': 'anhui', '东北菜': 'northeast', '西北菜': 'northwest', '海鲜': 'seafood',
    '汤煲': 'soup', '主食': 'staple', '甜品': 'dessert',
    '西餐': 'western', '日料': 'japanese',
}

CUISINE_EMOJI = {
    'home': '🍳', 'sichuan': '🌶️', 'cantonese': '🥢', 'hunan': '🌶️',
    'shandong': '🍲', 'jiangsu': '🦀', 'zhejiang': '🍵', 'fujian': '🐟',
    'anhui': '🎍', 'northeast': '🥘', 'northwest': '🍖', 'seafood': '🦐',
    'soup': '🍲', 'staple': '🍚', 'dessert': '🍰',
    'western': '🍝', 'japanese': '🍣',
}


def _norm_ingredients(raw):
    """统一把 ingredients 字段规整为 [{name, amount}] 列表"""
    result = []
    for item in raw or []:
        if isinstance(item, str):
            result.append({'name': item, 'amount': ''})
        elif isinstance(item, dict):
            result.append({
                'name': item.get('name', ''),
                'amount': item.get('amount', ''),
            })
    return result


def _js_value(v, indent=4):
    """把 Python 值转成 JS 字面量"""
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, str):
        # 转义引号与反斜杠
        escaped = v.replace('\\', '\\\\').replace('"', '\\"')
        return f'"{escaped}"'
    if isinstance(v, list):
        if not v:
            return '[]'
        pad = ' ' * (indent + 2)
        inner = ',\n'.join(pad + _js_value(x, indent + 2) for x in v)
        return f'[\n{inner}\n{" " * indent}]'
    if isinstance(v, dict):
        if not v:
            return '{}'
        pad = ' ' * (indent + 2)
        items = []
        for k, val in v.items():
            items.append(f'{pad}{k}: {_js_value(val, indent + 2)}')
        inner = ',\n'.join(items)
        return f'{{\n{inner}\n{" " * indent}}}'
    return 'null'


def gen_dish_block(dish, idx):
    """生成单道菜品的 JS 对象字面量"""
    obj = {
        'id': idx + 1,
        'name': dish['name'],
        'category': dish['category'],
        'cuisine': dish.get('cuisine', CUISINE_KEY.get(dish['category'], '')),
        'tags': dish.get('tags', []),
        'cover': dish.get('cover', ''),
        'categoryTag': dish.get('categoryTag', ''),
        'spiceLevel': dish.get('spiceLevel', '不辣'),
        'description': dish['description'],
        'difficulty': dish['difficulty'],
        'time': dish['time'],
        'calories': dish['calories'],
        'protein': dish.get('protein', 0),
        'fat': dish.get('fat', 0),
        'carbs': dish.get('carbs', 0),
        'servings': dish.get('servings', 1),
        'ingredients': _norm_ingredients(dish['ingredients']),
        'steps': [
            {'title': s['title'], 'desc': s['desc'], 'time': s.get('time', 0)}
            for s in dish['steps']
        ],
        'tips': dish.get('tips', ''),
        'videoId': dish.get('videoId'),
    }
    return _js_value(obj, indent=2)


def gen():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    pool = data['ingredients_pool']
    dishes = data['dishes']

    # 1) dishes 数组
    dish_blocks = [gen_dish_block(d, i) for i, d in enumerate(dishes)]
    dishes_js = 'const dishes = [\n' + ',\n'.join(f'  {b}' for b in dish_blocks) + '\n]'

    # 2) allIngredients 数组
    ing_items = []
    for ing in pool:
        ing_items.append({
            'name': ing['name'],
            'emoji': ing.get('emoji', '🍽️'),
            'type': ing.get('type', 'other'),
            'icon': ing.get('icon', ''),
        })
    all_ingredients_js = 'const allIngredients = ' + _js_value(ing_items, indent=0)

    # 3) ingredientTypes
    type_names = {
        'vegetable': ('蔬菜', '🥬'), 'meat': ('肉禽', '🥩'),
        'seafood': ('海鲜', '🦐'), 'egg': ('蛋豆', '🥚'),
        'staple': ('主食', '🍚'), 'seasoning': ('调味', '🧂'),
        'other': ('其他', '🍽️'),
    }
    ing_types = [{'key': 'all', 'name': '全部', 'emoji': '🎲'}]
    seen = set()
    for ing in pool:
        t = ing.get('type', 'other')
        if t in seen or t == 'other':
            continue
        seen.add(t)
        name, emoji = type_names.get(t, ('其他', '🍽️'))
        ing_types.append({'key': t, 'name': name, 'emoji': emoji})
    # 保证排序稳定
    type_order = ['seasoning', 'meat', 'seafood', 'egg', 'vegetable', 'staple']
    ing_types_sorted = [ing_types[0]] + sorted(
        [x for x in ing_types[1:]], key=lambda x: type_order.index(x['key']) if x['key'] in type_order else 99
    )
    ingredient_types_js = 'const ingredientTypes = ' + _js_value(ing_types_sorted, indent=0)

    # 4) cuisineTypes（含英文 key）
    cuisine_keys_in_data = []
    seen_cuisines = set()
    for d in dishes:
        c = d.get('cuisine') or CUISINE_KEY.get(d['category'], '')
        if c and c not in seen_cuisines:
            seen_cuisines.add(c)
            cuisine_keys_in_data.append(c)
    # 中文菜系在 categories 中的顺序
    cat_order = []
    seen_cat = set()
    for d in dishes:
        if d['category'] not in seen_cat:
            seen_cat.add(d['category'])
            cat_order.append(d['category'])

    cuisine_types = [{'key': 'all', 'name': '全部', 'emoji': '🍽️'}]
    for cat in cat_order:
        key = CUISINE_KEY.get(cat, cat)
        cuisine_types.append({
            'key': key,
            'name': cat,
            'emoji': CUISINE_EMOJI.get(key, '🍳'),
        })
    cuisine_types_js = 'const cuisineTypes = ' + _js_value(cuisine_types, indent=0)

    # 5) spiceLevels
    spice_levels = [
        {'key': 'all', 'name': '不限', 'emoji': '🍳'},
        {'key': '不辣', 'name': '不辣', 'emoji': '🚫'},
        {'key': '微辣', 'name': '微辣', 'emoji': '🌶️'},
        {'key': '中辣', 'name': '中辣', 'emoji': '🌶️'},
        {'key': '重辣', 'name': '重辣', 'emoji': '🔥'},
    ]
    spice_levels_js = 'const spiceLevels = ' + _js_value(spice_levels, indent=0)

    # 6) getCategories
    categories = ['全部'] + cat_order
    get_categories_js = 'function getCategories() {\n  return ' + _js_value(categories, indent=2) + '\n}'

    # 组装最终文件
    content = f"""/**
 * 菜品数据库 - Mock 数据
 * 共 {len(dishes)} 道菜品，{len(pool)} 种食材
 * 由 dishes-data.json 自动生成（gen_mock.py）
 * 含字段：cuisine(英文key) / tags / cover / protein / fat / carbs / servings
 * 食材格式：{{name, amount}}
 */

{dishes_js}

{all_ingredients_js}

{ingredient_types_js}

{cuisine_types_js}

{spice_levels_js}

{get_categories_js}

module.exports = {{ dishes, allIngredients, ingredientTypes, cuisineTypes, spiceLevels, getCategories }}
"""

    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ 已生成：{OUT_PATH}")
    print(f"   菜品：{len(dishes)} 道")
    print(f"   食材：{len(pool)} 种")
    print(f"   菜系（含英文 key）：{len(cuisine_types) - 1} 种")
    print(f"   食材类型：{len(ing_types_sorted) - 1} 种")
    # 字段覆盖统计
    has_cuisine = sum(1 for d in dishes if d.get('cuisine'))
    has_tags = sum(1 for d in dishes if d.get('tags'))
    has_cover = sum(1 for d in dishes if d.get('cover'))
    has_nutrition = sum(1 for d in dishes if d.get('protein') is not None)
    has_amount = sum(1 for d in dishes
                     for ing in _norm_ingredients(d['ingredients']) if ing.get('amount'))
    total_ing = sum(len(_norm_ingredients(d['ingredients'])) for d in dishes)
    print(f"   cuisine 字段：{has_cuisine}/{len(dishes)}")
    print(f"   tags 字段：{has_tags}/{len(dishes)}")
    print(f"   cover 字段：{has_cover}/{len(dishes)}")
    print(f"   营养字段：{has_nutrition}/{len(dishes)}")
    print(f"   食材含用量：{has_amount}/{total_ing}")


if __name__ == '__main__':
    gen()
