"""
管理员路由 - 用户管理
- GET    /users                  用户列表（分页+搜索）
- PUT    /users/{id}/toggle      启用/禁用用户
- PUT    /users/{id}/admin       设置/取消管理员
- PUT    /users/{id}/password    重置密码
- DELETE /users/{id}             删除用户
"""
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query
from app.deps import require_admin
from app.services import auth_service
from app import database as db
from fastapi import Body

router = APIRouter()


@router.get("/dashboard")
async def dashboard(admin: dict = Depends(require_admin)):
    return auth_service.get_admin_dashboard()


@router.get("/audit-logs")
async def audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    admin: dict = Depends(require_admin),
):
    return auth_service.list_audit_logs(page, page_size)


@router.get("/dishes")
async def admin_dishes(
    keyword: str = Query(""), page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100), admin: dict = Depends(require_admin),
):
    return db.admin_list_dishes(keyword.strip(), page, page_size)


@router.post("/dishes")
async def create_dish(data: dict = Body(...), admin: dict = Depends(require_admin)):
    try:
        dish = db.admin_save_dish(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    auth_service.record_audit_log(admin["id"], "create_dish", "dish", dish["id"])
    return {"dish": dish}


@router.put("/dishes/{dish_id}")
async def update_dish(dish_id: int, data: dict = Body(...), admin: dict = Depends(require_admin)):
    try:
        dish = db.admin_save_dish(data, dish_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    auth_service.record_audit_log(admin["id"], "update_dish", "dish", dish_id)
    return {"dish": dish}


@router.delete("/dishes/{dish_id}")
async def delete_dish(dish_id: int, admin: dict = Depends(require_admin)):
    if not db.admin_delete_dish(dish_id):
        raise HTTPException(status_code=404, detail="菜品不存在")
    auth_service.record_audit_log(admin["id"], "delete_dish", "dish", dish_id)
    return {"message": "菜品已删除"}


@router.put("/dishes/{dish_id}/steps")
async def replace_steps(dish_id: int, steps: list[dict] = Body(...), admin: dict = Depends(require_admin)):
    result = db.admin_replace_steps(dish_id, steps)
    auth_service.record_audit_log(admin["id"], "replace_steps", "dish", dish_id, f"count={len(steps)}")
    return result


@router.post("/ingredients")
async def create_ingredient(data: dict = Body(...), admin: dict = Depends(require_admin)):
    try:
        ingredient = db.admin_save_ingredient(data)
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    auth_service.record_audit_log(admin["id"], "create_ingredient", "ingredient", ingredient.get("id", ""))
    return {"ingredient": ingredient}


@router.get("/ingredients")
async def admin_ingredients(admin: dict = Depends(require_admin)):
    with db.get_conn() as conn:
        rows = conn.execute(
            "SELECT i.*, t.name AS type_name FROM ingredients i "
            "LEFT JOIN ingredient_types t ON t.id = i.type_id ORDER BY i.id"
        ).fetchall()
    return {"ingredients": [dict(row) for row in rows]}


@router.put("/ingredients/{ingredient_id}")
async def update_ingredient(ingredient_id: int, data: dict = Body(...), admin: dict = Depends(require_admin)):
    ingredient = db.admin_save_ingredient(data, ingredient_id)
    auth_service.record_audit_log(admin["id"], "update_ingredient", "ingredient", ingredient_id)
    return {"ingredient": ingredient}


@router.delete("/ingredients/{ingredient_id}")
async def delete_ingredient(ingredient_id: int, admin: dict = Depends(require_admin)):
    try:
        deleted = db.admin_delete_ingredient(ingredient_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    if not deleted:
        raise HTTPException(status_code=404, detail="食材不存在")
    auth_service.record_audit_log(admin["id"], "delete_ingredient", "ingredient", ingredient_id)
    return {"message": "食材已删除"}


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
    auth_service.record_audit_log(admin["id"], "toggle_user_active", "user", user_id)
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
    auth_service.record_audit_log(
        admin["id"], "set_user_admin", "user", user_id, f"is_admin={is_admin}"
    )
    return {"message": "管理员状态已更新", "user": user}


@router.put("/users/{user_id}/password")
async def reset_password(user_id: int, admin: dict = Depends(require_admin)):
    """Generate a one-time temporary password for an account."""
    temporary_password = secrets.token_urlsafe(9)
    ok = auth_service.reset_user_password(user_id, temporary_password)
    if not ok:
        raise HTTPException(status_code=404, detail="用户不存在")
    auth_service.record_audit_log(admin["id"], "reset_user_password", "user", user_id)
    return {"message": "临时密码已生成", "temporary_password": temporary_password}


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, admin: dict = Depends(require_admin)):
    """删除用户"""
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="不能删除自己")
    if not auth_service.delete_user(user_id):
        raise HTTPException(status_code=404, detail="用户不存在")
    auth_service.record_audit_log(admin["id"], "delete_user", "user", user_id)
    return {"message": "用户已删除"}
