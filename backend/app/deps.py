"""
认证依赖 - FastAPI Depends 用
- get_current_user：从 Authorization header 解析 token，返回用户
- get_current_user_optional：可选认证，未登录返回 None
- require_admin：要求管理员
"""
from fastapi import Depends, HTTPException, Header, status
from typing import Optional
from app.services import auth_service


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """要求登录，返回当前用户字典"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证信息",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = auth_service.decode_token(authorization)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="token 无效或已过期",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = auth_service.get_user_by_id(payload.get("user_id"))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用",
        )

    return user


def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """可选认证：已登录返回用户，未登录返回 None（不报错）"""
    if not authorization:
        return None
    payload = auth_service.decode_token(authorization)
    if not payload:
        return None
    user = auth_service.get_user_by_id(payload.get("user_id"))
    if user and not user["is_active"]:
        return None
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """要求管理员权限"""
    if not user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
        )
    return user
