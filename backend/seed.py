"""Idempotent reference-data seed for an empty SQLite or PostgreSQL database."""
from __future__ import annotations

import json
from pathlib import Path

from app.config import IS_POSTGRES
from app.database import get_conn

BASE = Path(__file__).resolve().parent
DATA_FILE = BASE / "app" / "data" / "dishes-data.json"
VIDEO_FILE = BASE / "app" / "data" / "dish-videos.json"

TYPE_NAMES = {
    "vegetable": ("蔬菜", "🥬"), "meat": ("肉禽", "🥩"), "seafood": ("海鲜", "🦐"),
    "egg": ("蛋豆", "🥚"), "staple": ("主食", "🍚"), "seasoning": ("调味", "🧂"),
    "other": ("其他", "🍽️"),
}


def _ingredients(raw):
    for item in raw or []:
        yield {"name": item, "amount": ""} if isinstance(item, str) else {
            "name": item.get("name", ""), "amount": item.get("amount", "")
        }


def seed() -> dict[str, int]:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    pool, dishes = data["ingredients_pool"], data["dishes"]
    with get_conn() as conn:
        existing = conn.execute("SELECT COUNT(*) AS c FROM dishes").fetchone()["c"]
        if existing:
            return {"dishes": existing, "skipped": 1}

        type_ids = {}
        for key in dict.fromkeys(item.get("type", "other") for item in pool):
            name, emoji = TYPE_NAMES.get(key, TYPE_NAMES["other"])
            type_ids[key] = conn.execute(
                "INSERT INTO ingredient_types (key, name, emoji) VALUES (?, ?, ?)", (key, name, emoji)
            ).lastrowid

        ingredient_ids = {}
        for item in pool:
            ingredient_ids[item["name"]] = conn.execute(
                "INSERT INTO ingredients (name, emoji, type_id, icon) VALUES (?, ?, ?, ?)",
                (item["name"], item.get("emoji", "🍽️"), type_ids[item.get("type", "other")], item.get("icon", "")),
            ).lastrowid

        category_ids = {}
        for index, name in enumerate(dict.fromkeys(item["category"] for item in dishes)):
            category_ids[name] = conn.execute(
                "INSERT INTO categories (name, sort_order) VALUES (?, ?)", (name, index)
            ).lastrowid

        for item in dishes:
            dish_id = conn.execute(
                "INSERT INTO dishes (name, category_id, category_tag, cuisine, tags, cover, spice_level, "
                "description, difficulty, time, calories, protein, fat, carbs, servings, tips, video_id) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (item["name"], category_ids[item["category"]], item.get("categoryTag", ""), item.get("cuisine", ""),
                 json.dumps(item.get("tags", []), ensure_ascii=False), item.get("cover", ""), item.get("spiceLevel", "不辣"),
                 item.get("description", ""), item.get("difficulty", "简单"), item.get("time", 15),
                 item.get("calories", 0), item.get("protein", 0), item.get("fat", 0), item.get("carbs", 0),
                 item.get("servings", 1), item.get("tips", ""), item.get("videoId")),
            ).lastrowid
            for ingredient in _ingredients(item.get("ingredients")):
                ingredient_id = ingredient_ids.get(ingredient["name"])
                if ingredient_id:
                    conn.execute(
                        "INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id, is_main, amount) VALUES (?, ?, 0, ?)",
                        (dish_id, ingredient_id, ingredient["amount"]),
                    )
            for index, step in enumerate(item.get("steps", []), 1):
                conn.execute(
                    "INSERT INTO dish_steps (dish_id, step_index, title, description, time) VALUES (?, ?, ?, ?, ?)",
                    (dish_id, index, step.get("title", f"步骤{index}"), step.get("desc", ""), step.get("time", 0)),
                )

        videos = json.loads(VIDEO_FILE.read_text(encoding="utf-8")).get("videos", []) if VIDEO_FILE.exists() else []
        valid_dishes = {row["id"] for row in conn.execute("SELECT id FROM dishes").fetchall()}
        for video in videos:
            if video.get("dish_id") not in valid_dishes:
                continue
            conn.execute(
                "INSERT INTO dish_videos (id, dish_id, dish_name, title, category, tags, cover, duration, "
                "source, author, external_url, video_url, playable_in_miniprogram, description) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (video["id"], video["dish_id"], video.get("dish_name", ""), video["title"], video.get("category", ""),
                 json.dumps(video.get("tags", []), ensure_ascii=False), video.get("cover", ""), video.get("duration", ""),
                 video.get("source", ""), video.get("author", ""), video.get("external_url", ""), video.get("video_url", ""),
                 1 if video.get("playable_in_miniprogram") else 0, video.get("description", "")),
            )

    with get_conn() as conn:
        return {table: conn.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()["c"]
                for table in ("dishes", "ingredients", "dish_steps", "dish_videos")}


if __name__ == "__main__":
    print(json.dumps(seed(), ensure_ascii=False))
