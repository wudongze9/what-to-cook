CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, sort_order INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS ingredient_types (
    id BIGSERIAL PRIMARY KEY, key TEXT NOT NULL UNIQUE, name TEXT NOT NULL, emoji TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS ingredients (
    id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, emoji TEXT DEFAULT '',
    type_id BIGINT REFERENCES ingredient_types(id), icon TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS dishes (
    id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, category_id BIGINT REFERENCES categories(id),
    category_tag TEXT DEFAULT '', cuisine TEXT DEFAULT '', tags TEXT DEFAULT '', cover TEXT DEFAULT '',
    spice_level TEXT DEFAULT '不辣', description TEXT DEFAULT '', difficulty TEXT DEFAULT '简单',
    time INTEGER DEFAULT 15, calories INTEGER DEFAULT 0, protein DOUBLE PRECISION DEFAULT 0,
    fat DOUBLE PRECISION DEFAULT 0, carbs DOUBLE PRECISION DEFAULT 0, servings INTEGER DEFAULT 1,
    tips TEXT DEFAULT '', video_id TEXT, image_url TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS dish_ingredients (
    id BIGSERIAL PRIMARY KEY, dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id), is_main INTEGER DEFAULT 0,
    amount TEXT DEFAULT '', UNIQUE(dish_id, ingredient_id)
);
CREATE TABLE IF NOT EXISTS dish_steps (
    id BIGSERIAL PRIMARY KEY, dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', time INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT DEFAULT '',
    nickname TEXT DEFAULT '', avatar TEXT DEFAULT '', signature TEXT DEFAULT '', wx_openid TEXT DEFAULT '',
    is_admin INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, last_login TEXT DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_openid ON users(wx_openid) WHERE wx_openid <> '';
CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, dish_id)
);
CREATE TABLE IF NOT EXISTS user_history (
    id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferences_json TEXT NOT NULL DEFAULT '{}', updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_shopping_items (
    id TEXT NOT NULL, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, amount TEXT DEFAULT '', dish_id TEXT DEFAULT 'manual', dish_name TEXT DEFAULT '手动添加',
    checked INTEGER DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(id, user_id)
);
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGSERIAL PRIMARY KEY, admin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action TEXT NOT NULL, target_type TEXT DEFAULT '', target_id TEXT DEFAULT '', detail TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dish_videos (
    id TEXT PRIMARY KEY, dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    dish_name TEXT DEFAULT '', title TEXT NOT NULL, category TEXT DEFAULT '', tags TEXT DEFAULT '',
    cover TEXT DEFAULT '', duration TEXT DEFAULT '', source TEXT DEFAULT '', author TEXT DEFAULT '',
    external_url TEXT DEFAULT '', video_url TEXT DEFAULT '', playable_in_miniprogram INTEGER DEFAULT 0,
    description TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_di_ingredient ON dish_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_di_dish ON dish_ingredients(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_spice ON dishes(spice_level);
CREATE INDEX IF NOT EXISTS idx_dishes_cuisine ON dishes(cuisine);
CREATE INDEX IF NOT EXISTS idx_history_user ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_user ON user_shopping_items(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dish_videos_dish ON dish_videos(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_videos_source ON dish_videos(source);
