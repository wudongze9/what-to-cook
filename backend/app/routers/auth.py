"""
用户认证路由
- POST /register     账号密码注册
- POST /login        账号密码登录
- POST /wx-login     微信登录
- GET  /me           获取当前用户信息
- PUT  /profile      更新用户资料
- PUT  /password     修改密码
"""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from app.services import auth_service
from app.deps import get_current_user
from app.models.schemas import (
    RegisterRequest, LoginRequest, WxLoginRequest,
    UpdateProfileRequest, ChangePasswordRequest, UserPreferencesRequest, UserResponse,
)
from app.services.storage_service import save_bytes

router = APIRouter()


def _user_response(user: dict) -> dict:
    """构造前端需要的用户信息结构"""
    return {
        "id": user["id"],
        "username": user["username"],
        "nickname": user["nickname"],
        "avatar": user["avatar"],
        "signature": user["signature"],
        "is_admin": user["is_admin"],
        "is_active": user["is_active"],
        "created_at": user["created_at"],
        "last_login": user["last_login"],
    }


@router.post("/register")
async def register(req: RegisterRequest):
    """账号密码注册"""
    result = auth_service.register(req.username, req.password, req.nickname)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"],
        )
    return {
        "message": result["message"],
        "user": _user_response(result["user"]),
        "token": result["token"],
    }


@router.post("/login")
async def login(req: LoginRequest):
    """账号密码登录"""
    result = auth_service.login(req.username, req.password)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["message"],
        )
    return {
        "message": result["message"],
        "user": _user_response(result["user"]),
        "token": result["token"],
    }


@router.post("/wx-login")
async def wx_login(req: WxLoginRequest):
    """微信登录（小程序 wx.login 拿到 code 后调用）"""
    result = auth_service.wx_login(req.code, req.nickname, req.avatar)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["message"],
        )
    return {
        "message": result["message"],
        "user": _user_response(result["user"]),
        "token": result["token"],
    }


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """获取当前登录用户信息"""
    return {"user": _user_response(user)}


@router.put("/profile")
async def update_profile(
    req: UpdateProfileRequest,
    user: dict = Depends(get_current_user),
):
    """更新用户资料（昵称/头像/签名）"""
    updated = auth_service.update_user_profile(
        user["id"], req.nickname, req.avatar, req.signature,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"message": "资料更新成功", "user": _user_response(updated)}


@router.put("/password")
async def change_password(
    req: ChangePasswordRequest,
    user: dict = Depends(get_current_user),
):
    """修改密码"""
    minimum = 10 if user.get("is_admin") else 6
    if not req.new_password or len(req.new_password) < minimum:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"新密码至少 {minimum} 位",
        )
    success = auth_service.change_password(
        user["id"], req.old_password, req.new_password,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="原密码错误",
        )
    if user.get("is_admin"):
        auth_service.record_audit_log(user["id"], "change_own_password", "user", user["id"])
    return {"message": "密码修改成功"}


@router.get("/preferences")
async def get_preferences(user: dict = Depends(get_current_user)):
    return {"preferences": auth_service.get_user_preferences(user["id"])}


@router.put("/preferences")
async def update_preferences(
    req: UserPreferencesRequest,
    user: dict = Depends(get_current_user),
):
    if req.household_size < 1 or req.household_size > 20:
        raise HTTPException(status_code=400, detail="家庭人数应在 1 到 20 之间")
    preferences = auth_service.update_user_preferences(user["id"], req.model_dump())
    return {"message": "饮食偏好已保存", "preferences": preferences}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    content_type = (file.content_type or "").lower()
    extensions = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    if content_type not in extensions:
        raise HTTPException(status_code=400, detail="仅支持 JPG、PNG 或 WebP 头像")
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="头像不能超过 2MB")
    avatar = await save_bytes(
        content, folder="avatars", owner=f"u{user['id']}",
        extension=extensions[content_type], content_type=content_type,
    )
    updated = auth_service.update_user_profile(user["id"], avatar=avatar)
    return {"avatar": avatar, "user": _user_response(updated)}
