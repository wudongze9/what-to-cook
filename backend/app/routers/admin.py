"""
管理员路由 - 用户管理
- GET    /users                  用户列表（分页+搜索）
- PUT    /users/{id}/toggle      启用/禁用用户
- PUT    /users/{id}/admin       设置/取消管理员
- PUT    /users/{id}/password    重置密码
- DELETE /users/{id}             删除用户
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.deps import require_admin
from app.services import auth_service

router = APIRouter()


@router.get("/users")
async def list_users(
    keyword: str = Query("", description="按用户名/昵称搜索"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
):
    """获取用户列表（需管理员权限）"""
    result = auth_service.list_users(keyword=keyword.strip(), page=page, page_size=page_size)
    return result


@router.put("/users/{user_id}/toggle")
async def toggle_user_active(user_id: int, admin: dict = Depends(require_admin)):
    """启用/禁用用户"""
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="不能禁用自己")
    user = auth_service.toggle_user_active(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"message": "状态已更新", "user": user}


@router.put("/users/{user_id}/admin")
async def toggle_user_admin(
    user_id: int,
    is_admin: bool = Query(..., description="true=设为管理员 false=取消"),
    admin: dict = Depends(require_admin),
):
    """设置/取消管理员"""
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="不能修改自己的管理员状态")
    user = auth_service.set_user_admin(user_id, is_admin)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"message": "管理员状态已更新", "user": user}


@router.put("/users/{user_id}/password")
async def reset_password(user_id: int, admin: dict = Depends(require_admin)):
    """重置用户密码为 123456"""
    ok = auth_service.reset_user_password(user_id, "123456")
    if not ok:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"message": "密码已重置为 123456"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, admin: dict = Depends(require_admin)):
    """删除用户"""
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="不能删除自己")
    if not auth_service.delete_user(user_id):
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"message": "用户已删除"}
