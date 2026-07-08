"""
数据迁移脚本：从 dishes-data.json 导入到 SQLite
运行：python migrate.py
"""
import json
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), 'whattocook.db')
DATA_PATH = os.path.join(os.path.dirname(__file__), 'app', 'data', 'dishes-data.json')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'app', 'data', 'schema.sql')
VIDEOS_PATH = os.path.join(os.path.dirname(__file__), 'app', 'data', 'dish-videos.json')


def _norm_ingredients(raw):
    """统一把 ingredients 字段规整为 [{name, amount}] 列表

    兼容两种旧格式：
      - ["番茄", "鸡蛋"]            （字符串数组）
      - [{"name": "番茄", "amount": "2个"}]
    """
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


def migrate():
    # 删除旧数据库
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("已删除旧数据库")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")

    # ① 建表
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    print("✅ 建表完成")

    # ② 读取 JSON 数据
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    pool = data['ingredients_pool']
    dishes = data['dishes']
    print(f"数据源：{len(dishes)} 道菜品，{len(pool)} 种食材")

    # ③ 导入食材类型
    types_map = {}
    type_rows = {}
    for ing in pool:
        t = ing.get('type', 'other')
        if t not in type_rows:
            type_names = {
                'vegetable': ('蔬菜', '🥬'), 'meat': ('肉禽', '🥩'),
                'seafood': ('海鲜', '🦐'), 'egg': ('蛋豆', '🥚'),
                'staple': ('主食', '🍚'), 'seasoning': ('调味', '🧂'),
                'other': ('其他', '🍽️'),
            }
            name, emoji = type_names.get(t, ('其他', '🍽️'))
            cursor = conn.execute(
                "INSERT INTO ingredient_types(key, name, emoji) VALUES(?,?,?)",
                (t, name, emoji)
            )
            type_rows[t] = cursor.lastrowid
        types_map[t] = type_rows[t]

    print(f"✅ 食材类型：{len(type_rows)} 种")

    # ④ 导入食材
    ing_id_map = {}
    for ing in pool:
        t = ing.get('type', 'other')
        type_id = types_map.get(t, types_map.get('other'))
        cursor = conn.execute(
            "INSERT INTO ingredients(name, emoji, type_id, icon) VALUES(?,?,?,?)",
            (ing['name'], ing.get('emoji', '🍽️'), type_id, ing.get('icon', ''))
        )
        ing_id_map[ing['name']] = cursor.lastrowid

    print(f"✅ 食材：{len(ing_id_map)} 种")

    # ⑤ 导入菜系
    cat_id_map = {}
    categories = sorted(set(d['category'] for d in dishes))
    for i, cat in enumerate(categories):
        cursor = conn.execute(
            "INSERT INTO categories(name, sort_order) VALUES(?,?)",
            (cat, i)
        )
        cat_id_map[cat] = cursor.lastrowid

    print(f"✅ 菜系：{len(cat_id_map)} 种")

    # ⑥ 导入菜品
    for dish in dishes:
        cat_id = cat_id_map.get(dish['category'])
        tags = dish.get('tags', [])
        tags_json = json.dumps(tags, ensure_ascii=False) if tags else ''

        cursor = conn.execute("""
            INSERT INTO dishes(name, category_id, category_tag, cuisine, tags, cover,
                               spice_level, description, difficulty, time, calories,
                               protein, fat, carbs, servings, tips, video_id)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            dish['name'], cat_id, dish.get('categoryTag', ''),
            dish.get('cuisine', ''), tags_json, dish.get('cover', ''),
            dish.get('spiceLevel', '不辣'), dish['description'],
            dish['difficulty'], dish['time'], dish['calories'],
            dish.get('protein', 0), dish.get('fat', 0),
            dish.get('carbs', 0), dish.get('servings', 1),
            dish.get('tips', ''), dish.get('videoId')
        ))
        dish_id = cursor.lastrowid

        # 菜品-食材关联（含用量 amount）
        for ing in _norm_ingredients(dish['ingredients']):
            ing_id = ing_id_map.get(ing['name'])
            if ing_id:
                conn.execute(
                    "INSERT OR IGNORE INTO dish_ingredients(dish_id, ingredient_id, is_main, amount) VALUES(?,?,0,?)",
                    (dish_id, ing_id, ing.get('amount', ''))
                )

        # 步骤
        for idx, step in enumerate(dish['steps']):
            conn.execute("""
                INSERT INTO dish_steps(dish_id, step_index, title, description, time)
                VALUES(?,?,?,?,?)
            """, (dish_id, idx, step['title'], step['desc'], step.get('time', 0)))

    print(f"✅ 菜品：{len(dishes)} 道")

    # ⑦ 导入菜品教学视频（dish-videos.json → dish_videos 表）
    video_count = 0
    if os.path.exists(VIDEOS_PATH):
        with open(VIDEOS_PATH, 'r', encoding='utf-8') as f:
            video_data = json.load(f)
        videos = video_data.get('videos', [])
        # 菜品 ID 集合，用于校验 dish_id 是否存在
        dish_id_set = {row[0] for row in conn.execute("SELECT id FROM dishes").fetchall()}
        for v in videos:
            dish_id = v.get('dish_id', 0)
            if dish_id not in dish_id_set:
                print(f"⚠️  跳过视频 {v.get('id', '?')}：dish_id={dish_id} 不存在")
                continue
            tags_list = v.get('tags', [])
            tags_json = json.dumps(tags_list, ensure_ascii=False) if tags_list else ''
            conn.execute("""
                INSERT OR REPLACE INTO dish_videos
                    (id, dish_id, dish_name, title, category, tags, cover, duration,
                     source, author, external_url, video_url, playable_in_miniprogram, description)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                v['id'], dish_id, v.get('dish_name', ''),
                v['title'], v.get('category', ''), tags_json,
                v.get('cover', ''), v.get('duration', ''),
                v.get('source', ''), v.get('author', ''),
                v.get('external_url', ''), v.get('video_url', ''),
                1 if v.get('playable_in_miniprogram') else 0,
                v.get('description', '')
            ))
            video_count += 1
        print(f"✅ 菜品教学视频：{video_count} 条")
    else:
        print("ℹ️  未找到 dish-videos.json，跳过视频导入")

    conn.commit()

    # 验证
    count_dishes = conn.execute("SELECT COUNT(*) FROM dishes").fetchone()[0]
    count_ings = conn.execute("SELECT COUNT(*) FROM ingredients").fetchone()[0]
    count_di = conn.execute("SELECT COUNT(*) FROM dish_ingredients").fetchone()[0]
    count_steps = conn.execute("SELECT COUNT(*) FROM dish_steps").fetchone()[0]
    # 新字段覆盖统计
    has_cuisine = conn.execute("SELECT COUNT(*) FROM dishes WHERE cuisine != ''").fetchone()[0]
    has_tags = conn.execute("SELECT COUNT(*) FROM dishes WHERE tags != ''").fetchone()[0]
    has_cover = conn.execute("SELECT COUNT(*) FROM dishes WHERE cover != ''").fetchone()[0]
    has_amount = conn.execute("SELECT COUNT(*) FROM dish_ingredients WHERE amount != ''").fetchone()[0]
    count_videos = conn.execute("SELECT COUNT(*) FROM dish_videos").fetchone()[0]
    dishes_with_video = conn.execute("SELECT COUNT(DISTINCT dish_id) FROM dish_videos").fetchone()[0]

    conn.close()
    print(f"\n📊 数据库验证：")
    print(f"   菜品：{count_dishes} 道")
    print(f"   食材：{count_ings} 种")
    print(f"   菜品-食材关联：{count_di} 条（其中 {has_amount} 条含用量）")
    print(f"   步骤：{count_steps} 步")
    print(f"   教学视频：{count_videos} 条，覆盖 {dishes_with_video} 道菜")
    print(f"   菜系字段已填：{has_cuisine}/{count_dishes}")
    print(f"   标签字段已填：{has_tags}/{count_dishes}")
    print(f"   封面字段已填：{has_cover}/{count_dishes}")
    print(f"\n✅ 迁移完成，数据库：{DB_PATH}")


if __name__ == '__main__':
    migrate()
