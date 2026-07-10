"""
数据访问层 - 封装所有 SQLite 数据库操作
"""
import sqlite3
import os
import json

DB_PATH = os.environ.get(
    'DATABASE_PATH',
    os.path.join(os.path.dirname(__file__), '..', 'whattocook.db'),
)
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'schema.sql')


def get_conn():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """初始化数据库（建表）"""
    with get_conn() as conn:
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            conn.executescript(f.read())


# ==================== 菜系 ====================

def get_all_categories():
    """获取所有菜系"""
    with get_conn() as conn:
        rows = conn.execute("SELECT name FROM categories ORDER BY sort_order").fetchall()
        return [r['name'] for r in rows]


def get_all_cuisines():
    """获取菜系列表（英文 key + 中文名）

    返回结构：[{key: 'home', name: '家常菜'}, ...]
    """
    cuisine_names = {
        'home': '家常菜', 'sichuan': '川菜', 'cantonese': '粤菜',
        'hunan': '湘菜', 'shandong': '鲁菜', 'jiangsu': '苏菜',
        'zhejiang': '浙菜', 'fujian': '闽菜', 'anhui': '徽菜',
        'northeast': '东北菜', 'northwest': '西北菜', 'seafood': '海鲜',
        'soup': '汤煲', 'staple': '主食', 'dessert': '甜品',
        'western': '西餐', 'japanese': '日料',
    }
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT DISTINCT cuisine FROM dishes
            WHERE cuisine != ''
            ORDER BY cuisine
        """).fetchall()
        return [
            {'key': r['cuisine'], 'name': cuisine_names.get(r['cuisine'], r['cuisine'])}
            for r in rows
        ]


def get_all_tags():
    """获取所有菜品标签（去重）"""
    with get_conn() as conn:
        rows = conn.execute("SELECT DISTINCT tags FROM dishes WHERE tags != ''").fetchall()
        tag_set = set()
        for r in rows:
            try:
                tags = json.loads(r['tags'])
                if isinstance(tags, list):
                    tag_set.update(tags)
            except (json.JSONDecodeError, TypeError):
                continue
        return sorted(tag_set)


# ==================== 食材 ====================

def get_all_ingredients():
    """获取所有食材（含类型信息）"""
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT i.id, i.name, i.emoji, i.icon,
                   t.key as type_key, t.name as type_name
            FROM ingredients i
            LEFT JOIN ingredient_types t ON i.type_id = t.id
            ORDER BY i.id
        """).fetchall()
        return [
            {
                'name': r['name'],
                'emoji': r['emoji'],
                'type': r['type_key'] or 'other',
                'icon': r['icon']
            }
            for r in rows
        ]


def get_ingredient_types():
    """获取食材类型列表"""
    with get_conn() as conn:
        rows = conn.execute("SELECT key, name, emoji FROM ingredient_types ORDER BY id").fetchall()
        return [{'key': r['key'], 'name': r['name'], 'emoji': r['emoji']} for r in rows]


# ==================== 菜品 ====================

def _format_dish(conn, row):
    """把数据库行格式化为前端期望的菜品结构"""
    dish = dict(row)
    dish_id = dish['id']

    dish['category'] = dish.pop('category_name', '')
    if 'category_id' in dish:
        del dish['category_id']

    # 食材列表（含用量 amount）
    ing_rows = conn.execute("""
        SELECT i.name, di.amount FROM dish_ingredients di
        JOIN ingredients i ON di.ingredient_id = i.id
        WHERE di.dish_id = ?
        ORDER BY di.id
    """, (dish_id,)).fetchall()
    dish['ingredients'] = [
        {'name': r['name'], 'amount': r['amount'] or ''}
        for r in ing_rows
    ]

    # 步骤列表
    step_rows = conn.execute("""
        SELECT title, description, time FROM dish_steps
        WHERE dish_id = ? ORDER BY step_index
    """, (dish_id,)).fetchall()
    dish['steps'] = [
        {'title': r['title'], 'desc': r['description'], 'time': r['time']}
        for r in step_rows
    ]

    # tags 字段：JSON 字符串 → 数组
    if 'tags' in dish:
        raw_tags = dish['tags'] or ''
        if raw_tags:
            try:
                dish['tags'] = json.loads(raw_tags)
            except (json.JSONDecodeError, TypeError):
                dish['tags'] = []
        else:
            dish['tags'] = []

    # 字段名兼容前端
    if 'category_tag' in dish:
        dish['categoryTag'] = dish.pop('category_tag')
    if 'spice_level' in dish:
        dish['spiceLevel'] = dish.pop('spice_level')
    if 'video_id' in dish:
        dish['videoId'] = dish.pop('video_id')
    if 'image_url' in dish:
        del dish['image_url']

    return dish


def get_dishes(category=None):
    """获取菜品列表，支持按菜系筛选"""
    with get_conn() as conn:
        if category and category != '全部':
            rows = conn.execute("""
                SELECT d.*, c.name as category_name
                FROM dishes d
                LEFT JOIN categories c ON d.category_id = c.id
                WHERE c.name = ?
                ORDER BY d.id
            """, (category,)).fetchall()
        else:
            rows = conn.execute("""
                SELECT d.*, c.name as category_name
                FROM dishes d
                LEFT JOIN categories c ON d.category_id = c.id
                ORDER BY d.id
            """).fetchall()
        return [_format_dish(conn, row) for row in rows]


def get_dish_detail(dish_id):
    """获取菜品详情"""
    with get_conn() as conn:
        row = conn.execute("""
            SELECT d.*, c.name as category_name
            FROM dishes d
            LEFT JOIN categories c ON d.category_id = c.id
            WHERE d.id = ?
        """, (dish_id,)).fetchone()
        if not row:
            return None
        return _format_dish(conn, row)


def get_dish_steps(dish_id):
    """获取菜品步骤"""
    with get_conn() as conn:
        dish = conn.execute("SELECT id, tips FROM dishes WHERE id = ?", (dish_id,)).fetchone()
        if not dish:
            return None
        rows = conn.execute("""
            SELECT title, description, time FROM dish_steps
            WHERE dish_id = ? ORDER BY step_index
        """, (dish_id,)).fetchall()
        return {
            'dish_id': dish_id,
            'steps': [
                {'title': r['title'], 'desc': r['description'], 'time': r['time']}
                for r in rows
            ],
            'tips': dish['tips']
        }


# ==================== 摇杆机匹配（核心查询）====================

def match_dishes_by_ingredients(
    ingredient_names, top_n=3, category=None, spice_level=None, excluded_ingredients=None
):
    """根据摇出的食材匹配菜品，按命中数排序"""
    if not ingredient_names:
        return []

    with get_conn() as conn:
        placeholders = ','.join('?' * len(ingredient_names))

        sql = f"""
            SELECT d.*,
                   c.name as category_name,
                   COUNT(di.ingredient_id) as hit_count,
                   (SELECT COUNT(*) FROM dish_ingredients WHERE dish_id = d.id) as total_ingredients
            FROM dishes d
            LEFT JOIN categories c ON d.category_id = c.id
            JOIN dish_ingredients di ON di.dish_id = d.id
            JOIN ingredients i ON di.ingredient_id = i.id
            WHERE i.name IN ({placeholders})
        """
        params = list(ingredient_names)

        if category and category not in ('全部', 'all'):
            # Mini Program uses stable cuisine keys (home/sichuan/...), while
            # older callers may still send the Chinese category label.
            sql += " AND (c.name = ? OR d.cuisine = ?)"
            params.extend([category, category])

        if spice_level and spice_level != 'all':
            spice_aliases = {
                'mild': '不辣',
                'light': '微辣',
                'medium': '中辣',
                'hot': '重辣',
            }
            spice_level = spice_aliases.get(spice_level, spice_level)
            sql += " AND d.spice_level = ?"
            params.append(spice_level)

        excluded_ingredients = [name for name in (excluded_ingredients or []) if name]
        if excluded_ingredients:
            excluded_placeholders = ','.join('?' * len(excluded_ingredients))
            sql += f"""
                AND NOT EXISTS (
                    SELECT 1 FROM dish_ingredients blocked_di
                    JOIN ingredients blocked_i ON blocked_i.id = blocked_di.ingredient_id
                    WHERE blocked_di.dish_id = d.id
                    AND blocked_i.name IN ({excluded_placeholders})
                )
            """
            params.extend(excluded_ingredients)

        sql += """
            GROUP BY d.id
            ORDER BY hit_count DESC, total_ingredients ASC
            LIMIT ?
        """
        params.append(top_n)

        rows = conn.execute(sql, params).fetchall()
        return [_format_dish(conn, row) for row in rows]


def pick_random_ingredients(count=3, ingredient_type='all'):
    """随机抽取 n 个食材"""
    with get_conn() as conn:
        if not ingredient_type or ingredient_type == 'all':
            rows = conn.execute("""
                SELECT i.name, i.emoji, t.key as type_key, i.icon
                FROM ingredients i
                LEFT JOIN ingredient_types t ON i.type_id = t.id
                ORDER BY RANDOM() LIMIT ?
            """, (count,)).fetchall()
        else:
            rows = conn.execute("""
                SELECT i.name, i.emoji, t.key as type_key, i.icon FROM ingredients i
                JOIN ingredient_types t ON i.type_id = t.id
                WHERE t.key = ?
                ORDER BY RANDOM() LIMIT ?
            """, (ingredient_type, count)).fetchall()
        return [
            {'name': r['name'], 'emoji': r['emoji'], 'type': r['type_key'], 'icon': r['icon']}
            for r in rows
        ]


# ==================== 用户收藏 ====================

def add_user_favorite(user_id: int, dish_id: int) -> bool:
    """添加收藏（已存在则忽略）"""
    with get_conn() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO user_favorites (user_id, dish_id) VALUES (?, ?)",
            (user_id, dish_id)
        )
    return True


def remove_user_favorite(user_id: int, dish_id: int) -> bool:
    """取消收藏"""
    with get_conn() as conn:
        conn.execute(
            "DELETE FROM user_favorites WHERE user_id = ? AND dish_id = ?",
            (user_id, dish_id)
        )
    return True


def get_user_favorites(user_id: int) -> list[dict]:
    """获取用户收藏列表（含菜品摘要）"""
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT f.dish_id, f.created_at,
                   d.name, c.name as category_name,
                   d.difficulty, d.time, d.calories, d.cover, d.cuisine, d.tags
            FROM user_favorites f
            JOIN dishes d ON f.dish_id = d.id
            LEFT JOIN categories c ON d.category_id = c.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        """, (user_id,)).fetchall()
        return [
            {
                'id': r['dish_id'],
                'name': r['name'],
                'category': r['category_name'] or '',
                'difficulty': r['difficulty'],
                'time': r['time'],
                'calories': r['calories'],
                'cover': r['cover'],
                'cuisine': r['cuisine'],
                'tags': r['tags'],
                'timestamp': int(__import__('time').mktime(
                    __import__('time').strptime(r['created_at'], '%Y-%m-%d %H:%M:%S')
                )) * 1000 if r['created_at'] else 0,
            }
            for r in rows
        ]


def is_user_favorited(user_id: int, dish_id: int) -> bool:
    """判断是否已收藏"""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT 1 FROM user_favorites WHERE user_id = ? AND dish_id = ?",
            (user_id, dish_id)
        ).fetchone()
    return row is not None


# ==================== 用户推荐历史 ====================

def add_user_history(user_id: int, dish_id: int):
    """添加推荐历史"""
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO user_history (user_id, dish_id) VALUES (?, ?)",
            (user_id, dish_id)
        )


def get_user_history(user_id: int, limit: int = 50) -> list[dict]:
    """获取用户推荐历史"""
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT h.dish_id, h.created_at,
                   d.name, c.name as category_name,
                   d.difficulty, d.time, d.calories, d.cover, d.cuisine, d.tags
            FROM user_history h
            JOIN dishes d ON h.dish_id = d.id
            LEFT JOIN categories c ON d.category_id = c.id
            WHERE h.user_id = ?
            ORDER BY h.id DESC
            LIMIT ?
        """, (user_id, limit)).fetchall()
        return [
            {
                'id': r['dish_id'],
                'name': r['name'],
                'category': r['category_name'] or '',
                'difficulty': r['difficulty'],
                'time': r['time'],
                'calories': r['calories'],
                'cover': r['cover'],
                'cuisine': r['cuisine'],
                'tags': r['tags'],
                'timestamp': int(__import__('time').mktime(
                    __import__('time').strptime(r['created_at'], '%Y-%m-%d %H:%M:%S')
                )) * 1000 if r['created_at'] else 0,
            }
            for r in rows
        ]


def clear_user_history(user_id: int):
    """清空用户历史"""
    with get_conn() as conn:
        conn.execute("DELETE FROM user_history WHERE user_id = ?", (user_id,))


# ==================== 管理台内容维护 ====================

def admin_list_dishes(keyword: str = "", page: int = 1, page_size: int = 20) -> dict:
    offset = (page - 1) * page_size
    where = "WHERE d.name LIKE ?" if keyword else ""
    params = [f"%{keyword}%"] if keyword else []
    with get_conn() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) AS c FROM dishes d {where}", params
        ).fetchone()["c"]
        rows = conn.execute(
            f"SELECT d.*, c.name AS category_name FROM dishes d "
            f"LEFT JOIN categories c ON c.id = d.category_id {where} "
            "ORDER BY d.id DESC LIMIT ? OFFSET ?",
            params + [page_size, offset],
        ).fetchall()
    return {"total": total, "page": page, "page_size": page_size, "dishes": [dict(row) for row in rows]}


def admin_save_dish(data: dict, dish_id: int | None = None) -> dict:
    allowed = [
        "name", "category_id", "category_tag", "cuisine", "tags", "cover",
        "spice_level", "description", "difficulty", "time", "calories",
        "protein", "fat", "carbs", "servings", "tips", "image_url",
    ]
    values = {key: data[key] for key in allowed if key in data}
    if "tags" in values and isinstance(values["tags"], list):
        values["tags"] = json.dumps(values["tags"], ensure_ascii=False)
    if not values.get("name") and dish_id is None:
        raise ValueError("菜品名称不能为空")
    with get_conn() as conn:
        if dish_id is None:
            columns = list(values)
            cursor = conn.execute(
                f"INSERT INTO dishes ({', '.join(columns)}) VALUES ({', '.join('?' for _ in columns)})",
                [values[key] for key in columns],
            )
            dish_id = cursor.lastrowid
        else:
            if not values:
                raise ValueError("没有可更新字段")
            conn.execute(
                "UPDATE dishes SET " + ", ".join(f"{key} = ?" for key in values) + " WHERE id = ?",
                [values[key] for key in values] + [dish_id],
            )
    return get_dish_detail(dish_id)


def admin_delete_dish(dish_id: int) -> bool:
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM dishes WHERE id = ?", (dish_id,))
    return cursor.rowcount > 0


def admin_replace_steps(dish_id: int, steps: list[dict]) -> list[dict]:
    with get_conn() as conn:
        conn.execute("DELETE FROM dish_steps WHERE dish_id = ?", (dish_id,))
        conn.executemany(
            "INSERT INTO dish_steps (dish_id, step_index, title, description, time) VALUES (?, ?, ?, ?, ?)",
            [(dish_id, index + 1, step.get("title", "步骤"), step.get("description", ""), step.get("time", 0)) for index, step in enumerate(steps)],
        )
    return get_dish_steps(dish_id)


def admin_save_ingredient(data: dict, ingredient_id: int | None = None) -> dict:
    with get_conn() as conn:
        if ingredient_id is None:
            cursor = conn.execute(
                "INSERT INTO ingredients (name, emoji, type_id, icon) VALUES (?, ?, ?, ?)",
                (data["name"], data.get("emoji", ""), data.get("type_id"), data.get("icon", "")),
            )
            ingredient_id = cursor.lastrowid
        else:
            conn.execute(
                "UPDATE ingredients SET name = ?, emoji = ?, type_id = ?, icon = ? WHERE id = ?",
                (data["name"], data.get("emoji", ""), data.get("type_id"), data.get("icon", ""), ingredient_id),
            )
        row = conn.execute("SELECT * FROM ingredients WHERE id = ?", (ingredient_id,)).fetchone()
    return dict(row) if row else {}


def admin_delete_ingredient(ingredient_id: int) -> bool:
    with get_conn() as conn:
        used = conn.execute("SELECT 1 FROM dish_ingredients WHERE ingredient_id = ? LIMIT 1", (ingredient_id,)).fetchone()
        if used:
            raise ValueError("食材已被菜品使用，不能直接删除")
        cursor = conn.execute("DELETE FROM ingredients WHERE id = ?", (ingredient_id,))
    return cursor.rowcount > 0


def get_user_shopping_list(user_id: int) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, name, amount, dish_id, dish_name, checked, updated_at "
            "FROM user_shopping_items WHERE user_id = ? ORDER BY updated_at DESC",
            (user_id,),
        ).fetchall()
    return [
        {
            "id": row["id"], "name": row["name"], "amount": row["amount"],
            "dishId": row["dish_id"], "dishName": row["dish_name"],
            "checked": bool(row["checked"]), "updatedAt": row["updated_at"],
        }
        for row in rows
    ]


def replace_user_shopping_list(user_id: int, items: list[dict]) -> list[dict]:
    with get_conn() as conn:
        conn.execute("DELETE FROM user_shopping_items WHERE user_id = ?", (user_id,))
        conn.executemany(
            "INSERT INTO user_shopping_items "
            "(id, user_id, name, amount, dish_id, dish_name, checked) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [(
                item["id"], user_id, item["name"], item.get("amount", ""),
                item.get("dish_id", "manual"), item.get("dish_name", "手动添加"),
                1 if item.get("checked") else 0,
            ) for item in items],
        )
    return get_user_shopping_list(user_id)


# ==================== 菜品教学视频 ====================

def _format_video(row: sqlite3.Row) -> dict:
    """格式化视频行 → 前端友好字典"""
    tags_raw = row["tags"] or "[]"
    try:
        tags = json.loads(tags_raw) if tags_raw.startswith("[") else []
    except Exception:
        tags = []
    return {
        "id": row["id"],
        "dishId": row["dish_id"],
        "dishName": row["dish_name"] or "",
        "title": row["title"],
        "category": row["category"] or "",
        "tags": tags,
        "cover": row["cover"] or "",
        "duration": row["duration"] or "",
        "source": row["source"] or "",
        "author": row["author"] or "",
        "externalUrl": row["external_url"] or "",
        "videoUrl": row["video_url"] or "",
        "playableInMiniprogram": bool(row["playable_in_miniprogram"]),
        "description": row["description"] or "",
    }


def get_videos_by_dish(dish_id: int) -> list[dict]:
    """按菜品 ID 查询所有教学视频（一菜多视频）"""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM dish_videos WHERE dish_id = ? ORDER BY id",
            (dish_id,)
        ).fetchall()
        return [_format_video(r) for r in rows]


def get_video_by_id(video_id: str) -> dict | None:
    """按视频条目 ID 查询单个视频"""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM dish_videos WHERE id = ?",
            (video_id,)
        ).fetchone()
        if not row:
            return None
        video = _format_video(row)
        related = conn.execute(
            "SELECT * FROM dish_videos WHERE dish_id != ? AND category = ? LIMIT 4",
            (row["dish_id"], row["category"] or "")
        ).fetchall()
        return {"video": video, "related": [_format_video(r) for r in related], "source": "db"}


def get_all_videos(category: str | None = None) -> list[dict]:
    """获取所有视频（可按菜系筛选）"""
    with get_conn() as conn:
        if category and category not in ("全部", "all"):
            rows = conn.execute(
                "SELECT * FROM dish_videos WHERE category = ? ORDER BY dish_id",
                (category,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM dish_videos ORDER BY dish_id"
            ).fetchall()
        return [_format_video(r) for r in rows]


def get_video_sources() -> list[str]:
    """获取所有视频来源平台"""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT DISTINCT source FROM dish_videos WHERE source != '' ORDER BY source"
        ).fetchall()
        return [r["source"] for r in rows]


def add_dish_video(data: dict) -> dict:
    """新增一条菜品视频（管理员用）"""
    vid = data.get("id") or f"v_{data['dish_id']}_{int(__import__('time').time())}"
    tags = data.get("tags", [])
    tags_json = json.dumps(tags, ensure_ascii=False) if tags else ""
    with get_conn() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO dish_videos
                (id, dish_id, dish_name, title, category, tags, cover, duration,
                 source, author, external_url, video_url, playable_in_miniprogram, description)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            vid, data["dish_id"], data.get("dish_name", ""),
            data["title"], data.get("category", ""), tags_json,
            data.get("cover", ""), data.get("duration", ""),
            data.get("source", ""), data.get("author", ""),
            data.get("external_url", ""), data.get("video_url", ""),
            1 if data.get("playable_in_miniprogram") else 0,
            data.get("description", "")
        ))
    return get_video_by_id(vid)


def delete_dish_video(video_id: str) -> bool:
    """删除一条视频"""
    with get_conn() as conn:
        cursor = conn.execute(
            "DELETE FROM dish_videos WHERE id = ?",
            (video_id,)
        )
        return cursor.rowcount > 0
