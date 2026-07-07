"""
用户认证服务
- 密码哈希（passlib bcrypt）
- JWT token 生成与验证
- 注册/登录/微信登录核心逻辑
"""
import os
import time
import logging
from datetime import datetime
import jwt
import bcrypt
from app.database import get_conn, init_db

logger = logging.getLogger(__name__)

# JWT 配置
JWT_SECRET = os.environ.get("JWT_SECRET", "whattocook-secret-key-2026-please-change")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72  # token 有效期 72 小时

# 微信小程序配置（开发期可用占位值，真机调试需填真实 AppID/AppSecret）
WX_APPID = os.environ.get("WX_APPID", "")
WX_SECRET = os.environ.get("WX_SECRET", "")


# ==================== 密码哈希 ====================

def hash_password(password: str) -> str:
    """密码哈希（bcrypt，限制 72 字节）"""
    pw_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """验证密码"""
    if not hashed:
        return False
    try:
        pw_bytes = plain.encode("utf-8")[:72]
        return bcrypt.checkpw(pw_bytes, hashed.encode("utf-8"))
    except Exception:
        return False


# ==================== JWT ====================

def create_token(user_id: int, username: str, is_admin: bool = False) -> str:
    """生成 JWT token"""
    payload = {
        "user_id": user_id,
        "username": username,
        "is_admin": is_admin,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRE_HOURS * 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """解析 JWT token，失败返回 None"""
    try:
        # 兼容 Bearer 前缀
        if token.startswith("Bearer "):
            token = token[7:]
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception as e:
        logger.warning(f"token 解析失败：{e}")
        return None


# ==================== 用户数据访问 ====================

def _row_to_user(row) -> dict:
    """数据库行转用户字典"""
    return {
        "id": row["id"],
        "username": row["username"],
        "nickname": row["nickname"] or row["username"],
        "avatar": row["avatar"] or "/images/icons/chef.svg",
        "signature": row["signature"],
        "wx_openid": row["wx_openid"],
        "is_admin": bool(row["is_admin"]),
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
        "last_login": row["last_login"],
    }


def get_user_by_id(user_id: int) -> dict | None:
    """按 ID 查用户"""
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return _row_to_user(row) if row else None


def get_user_by_username(username: str) -> dict | None:
    """按用户名查用户"""
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        return _row_to_user(row) if row else None


def get_user_by_openid(openid: str) -> dict | None:
    """按微信 openid 查用户"""
    if not openid:
        return None
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE wx_openid = ?", (openid,)).fetchone()
        return _row_to_user(row) if row else None


def _update_last_login(user_id: int):
    """更新最后登录时间"""
    with get_conn() as conn:
        conn.execute(
            "UPDATE users SET last_login = ? WHERE id = ?",
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), user_id)
        )


# ==================== 注册/登录核心逻辑 ====================

def register(username: str, password: str, nickname: str = "") -> dict:
    """账号密码注册

    Returns: {"success": bool, "message": str, "user": dict|None, "token": str|None}
    """
    # 参数校验
    if not username or len(username) < 2:
        return {"success": False, "message": "用户名至少 2 个字符"}
    if not password or len(password) < 6:
        return {"success": False, "message": "密码至少 6 位"}
    if len(username) > 20:
        return {"success": False, "message": "用户名不能超过 20 个字符"}

    # 检查用户名是否已存在
    if get_user_by_username(username):
        return {"success": False, "message": "用户名已被占用"}

    # 创建用户（首个用户自动成为管理员）
    with get_conn() as conn:
        count = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        is_admin = 1 if count == 0 else 0
        nick = nickname or username
        cursor = conn.execute(
            "INSERT INTO users (username, password_hash, nickname, is_admin) VALUES (?, ?, ?, ?)",
            (username, hash_password(password), nick, is_admin)
        )
        user_id = cursor.lastrowid

    user = get_user_by_id(user_id)
    _update_last_login(user_id)
    token = create_token(user_id, username, user["is_admin"])
    logger.info(f"新用户注册：{username}（管理员：{is_admin}）")
    return {"success": True, "message": "注册成功", "user": user, "token": token}


def login(username: str, password: str) -> dict:
    """账号密码登录"""
    user = get_user_by_username(username)
    if not user:
        return {"success": False, "message": "用户不存在"}
    if not user["is_active"]:
        return {"success": False, "message": "账号已被禁用，请联系管理员"}

    # 获取密码哈希进行验证
    with get_conn() as conn:
        row = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user["id"],)).fetchone()
    if not row or not verify_password(password, row["password_hash"]):
        return {"success": False, "message": "密码错误"}

    _update_last_login(user["id"])
    token = create_token(user["id"], user["username"], user["is_admin"])
    logger.info(f"用户登录：{username}")
    return {"success": True, "message": "登录成功", "user": user, "token": token}


def wx_login(code: str, nickname: str = "", avatar: str = "") -> dict:
    """微信登录（code 换 openid）

    开发期：如果未配置 AppID/AppSecret，则用 code 本身作为临时 openid，
    方便开发者工具调试。真机调试时需配置真实 AppID/AppSecret。
    """
    openid = _code_to_openid(code)
    if not openid:
        return {"success": False, "message": "微信登录失败：无法获取 openid"}

    # 查找已有用户
    user = get_user_by_openid(openid)
    if user:
        if not user["is_active"]:
            return {"success": False, "message": "账号已被禁用"}
        _update_last_login(user["id"])
        token = create_token(user["id"], user["username"], user["is_admin"])
        return {"success": True, "message": "登录成功", "user": user, "token": token}

    # 首次微信登录：自动创建账号
    username = "wx_" + openid[:12]
    # 避免用户名冲突
    if get_user_by_username(username):
        username = username + "_" + str(int(time.time()))

    with get_conn() as conn:
        count = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        is_admin = 1 if count == 0 else 0
        nick = nickname or ("微信用户" + openid[-4:])
        cursor = conn.execute(
            "INSERT INTO users (username, password_hash, nickname, avatar, wx_openid, is_admin) "
            "VALUES (?, '', ?, ?, ?, ?)",
            (username, nick, avatar, openid, is_admin)
        )
        user_id = cursor.lastrowid

    user = get_user_by_id(user_id)
    _update_last_login(user_id)
    token = create_token(user_id, user["username"], user["is_admin"])
    logger.info(f"微信登录新用户：{username}")
    return {"success": True, "message": "登录成功", "user": user, "token": token}


def _code_to_openid(code: str) -> str | None:
    """用 wx.login 的 code 换 openid

    开发期未配置 AppID/AppSecret 时，用 code 哈希作为临时 openid，
    保证同一开发者在同一基础库版本下 openid 稳定。
    """
    if not code:
        return None

    # 未配置微信 AppID，走开发降级
    if not WX_APPID or not WX_SECRET:
        import hashlib
        return "dev_" + hashlib.md5(code.encode("utf-8")).hexdigest()[:24]

    # 正式调用微信 code2session 接口
    try:
        import httpx
        url = (
            "https://api.weixin.qq.com/sns/jscode2session"
            f"?appid={WX_APPID}&secret={WX_SECRET}&js_code={code}"
            "&grant_type=authorization_code"
        )
        with httpx.Client(timeout=10, trust_env=False) as client:
            resp = client.get(url)
            data = resp.json()
        openid = data.get("openid")
        if openid:
            return openid
        logger.warning(f"微信 code2session 失败：{data}")
        return None
    except Exception as e:
        logger.error(f"微信 code2session 异常：{e}")
        return None


# ==================== 用户信息更新 ====================

def update_user_profile(user_id: int, nickname: str = None, avatar: str = None,
                        signature: str = None) -> dict | None:
    """更新用户资料"""
    user = get_user_by_id(user_id)
    if not user:
        return None

    sets = []
    params = []
    if nickname is not None and nickname.strip():
        sets.append("nickname = ?")
        params.append(nickname.strip())
    if avatar is not None and avatar.strip():
        sets.append("avatar = ?")
        params.append(avatar.strip())
    if signature is not None and signature.strip():
        sets.append("signature = ?")
        params.append(signature.strip())

    if not sets:
        return user

    params.append(user_id)
    with get_conn() as conn:
        conn.execute(f"UPDATE users SET {', '.join(sets)} WHERE id = ?", params)

    return get_user_by_id(user_id)


def change_password(user_id: int, old_password: str, new_password: str) -> bool:
    """修改密码（验证原密码后更新）"""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT password_hash FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    if not row or not verify_password(old_password, row["password_hash"]):
        return False
    with get_conn() as conn:
        conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (hash_password(new_password), user_id),
        )
    return True


def init_admin_if_empty():
    """如果用户表为空，提示首个注册用户将成为管理员（在 init_db 后调用）"""
    try:
        with get_conn() as conn:
            count = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        if count == 0:
            logger.info("用户表为空，首个注册的用户将自动成为管理员")
    except Exception:
        pass


# ==================== 管理员：用户管理 ====================

def list_users(keyword: str = "", page: int = 1, page_size: int = 20) -> dict:
    """获取用户列表（分页 + 关键词搜索）"""
    offset = (page - 1) * page_size
    with get_conn() as conn:
        if keyword:
            like = f"%{keyword}%"
            total = conn.execute(
                "SELECT COUNT(*) as c FROM users WHERE username LIKE ? OR nickname LIKE ?",
                (like, like),
            ).fetchone()["c"]
            rows = conn.execute(
                "SELECT * FROM users WHERE username LIKE ? OR nickname LIKE ? "
                "ORDER BY id DESC LIMIT ? OFFSET ?",
                (like, like, page_size, offset),
            ).fetchall()
        else:
            total = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
            rows = conn.execute(
                "SELECT * FROM users ORDER BY id DESC LIMIT ? OFFSET ?",
                (page_size, offset),
            ).fetchall()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "users": [_row_to_user(r) for r in rows],
    }


def toggle_user_active(user_id: int) -> dict | None:
    """启用/禁用用户"""
    user = get_user_by_id(user_id)
    if not user:
        return None
    new_status = 0 if user["is_active"] else 1
    with get_conn() as conn:
        conn.execute(
            "UPDATE users SET is_active = ? WHERE id = ?",
            (new_status, user_id),
        )
    return get_user_by_id(user_id)


def delete_user(user_id: int) -> bool:
    """删除用户（不能删自己需要由调用方保证）"""
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        return cur.rowcount > 0


def reset_user_password(user_id: int, new_password: str = "123456") -> bool:
    """管理员重置用户密码"""
    if len(new_password) < 6:
        return False
    with get_conn() as conn:
        cur = conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (hash_password(new_password), user_id),
        )
        return cur.rowcount > 0


def set_user_admin(user_id: int, is_admin: bool) -> dict | None:
    """设置/取消管理员"""
    user = get_user_by_id(user_id)
    if not user:
        return None
    with get_conn() as conn:
        conn.execute(
            "UPDATE users SET is_admin = ? WHERE id = ?",
            (1 if is_admin else 0, user_id),
        )
    return get_user_by_id(user_id)
