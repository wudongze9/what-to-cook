-- WhatToCook 数据库表结构
-- 6 张核心表：菜系、食材类型、食材、菜品、菜品-食材关联、菜品步骤

-- ① 菜系分类表
CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    sort_order  INTEGER DEFAULT 0
);

-- ② 食材类型表
CREATE TABLE IF NOT EXISTS ingredient_types (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    key   TEXT NOT NULL UNIQUE,
    name  TEXT NOT NULL,
    emoji TEXT DEFAULT ''
);

-- ③ 食材库表
CREATE TABLE IF NOT EXISTS ingredients (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL UNIQUE,
    emoji    TEXT DEFAULT '🍽️',
    type_id  INTEGER,
    icon     TEXT DEFAULT '',
    FOREIGN KEY (type_id) REFERENCES ingredient_types(id)
);

-- ④ 菜品主表
CREATE TABLE IF NOT EXISTS dishes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    category_id  INTEGER,
    category_tag TEXT DEFAULT '',
    cuisine      TEXT DEFAULT '',          -- 菜系英文 key：home/sichuan/cantonese...
    tags         TEXT DEFAULT '',          -- 标签 JSON 数组：["快手","下饭"]
    cover        TEXT DEFAULT '',          -- 菜品封面图路径
    spice_level  TEXT DEFAULT '不辣',
    description  TEXT DEFAULT '',
    difficulty   TEXT DEFAULT '简单',
    time         INTEGER DEFAULT 15,
    calories     INTEGER DEFAULT 0,
    protein      REAL DEFAULT 0,           -- 蛋白质 (g)
    fat          REAL DEFAULT 0,           -- 脂肪 (g)
    carbs        REAL DEFAULT 0,           -- 碳水 (g)
    servings     INTEGER DEFAULT 1,        -- 份数
    tips         TEXT DEFAULT '',
    video_id     TEXT,
    image_url    TEXT DEFAULT '',
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ⑤ 菜品-食材关联表（多对多）
CREATE TABLE IF NOT EXISTS dish_ingredients (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    dish_id       INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    is_main       INTEGER DEFAULT 0,
    amount        TEXT DEFAULT '',
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
    UNIQUE(dish_id, ingredient_id)
);

-- ⑥ 菜品步骤表
CREATE TABLE IF NOT EXISTS dish_steps (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    dish_id     INTEGER NOT NULL,
    step_index  INTEGER NOT NULL,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    time        INTEGER DEFAULT 0,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);

-- 索引：加速摇杆机匹配查询
CREATE INDEX IF NOT EXISTS idx_di_ingredient ON dish_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_di_dish ON dish_ingredients(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_spice ON dishes(spice_level);
CREATE INDEX IF NOT EXISTS idx_dishes_cuisine ON dishes(cuisine);

-- ⑦ 用户表
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,          -- 用户名（账号密码登录）
    password_hash TEXT DEFAULT '',               -- 密码哈希（passlib bcrypt）
    nickname      TEXT DEFAULT '',               -- 昵称（展示用）
    avatar        TEXT DEFAULT '',               -- 头像 URL
    signature     TEXT DEFAULT '把不知道吃什么，变成今天的小期待',  -- 个性签名
    wx_openid     TEXT DEFAULT '',               -- 微信 openid（微信登录用）
    is_admin      INTEGER DEFAULT 0,             -- 是否管理员 0/1
    is_active     INTEGER DEFAULT 1,             -- 是否启用 0/1
    created_at    TEXT DEFAULT (datetime('now','localtime')),
    last_login    TEXT DEFAULT ''
);

-- ⑧ 用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    dish_id    INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    UNIQUE(user_id, dish_id)
);

-- ⑨ 用户推荐历史表
CREATE TABLE IF NOT EXISTS user_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    dish_id    INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(wx_openid);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON user_history(user_id);
