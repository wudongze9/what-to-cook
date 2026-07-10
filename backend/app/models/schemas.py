from pydantic import BaseModel
from typing import Optional


class Step(BaseModel):
    title: str
    desc: str
    time: int


class Dish(BaseModel):
    id: int
    name: str
    category: str
    categoryTag: str = ""
    description: str
    difficulty: str
    time: int
    calories: int
    ingredients: list[str]
    steps: list[Step]
    tips: str
    videoId: Optional[str] = None


class DishBrief(BaseModel):
    id: int
    name: str
    category: str
    categoryTag: str = ""
    difficulty: str = ""
    time: int = 0
    calories: int = 0


class ShuffleResult(BaseModel):
    selected_ingredients: list[dict]
    matched_dish: Dish
    matched_dishes: list[Dish]


class Video(BaseModel):
    id: str
    title: str
    chef: str
    chefAvatar: str
    cover: str
    duration: str
    views: str
    category: str
    isFeatured: bool = False
    videoUrl: str = ""
    description: str = ""


class ChatRequest(BaseModel):
    message: str
    context: list[dict] = []


class ChatResponse(BaseModel):
    reply: str


class ShuffleRequest(BaseModel):
    """摇一摇请求 - 携带摇杆机摇出的食材"""
    selected_ingredients: list[str] = []
    category: Optional[str] = None
    spice_level: Optional[str] = None


# ==================== 用户认证相关 ====================

class RegisterRequest(BaseModel):
    """注册请求"""
    username: str
    password: str
    nickname: str = ""


class LoginRequest(BaseModel):
    """登录请求"""
    username: str
    password: str


class WxLoginRequest(BaseModel):
    """微信登录请求"""
    code: str
    nickname: str = ""
    avatar: str = ""


class UpdateProfileRequest(BaseModel):
    """更新用户资料请求"""
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    signature: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    """修改密码请求"""
    old_password: str
    new_password: str


class UserPreferencesRequest(BaseModel):
    dietary_tags: list[str] = []
    disliked_ingredients: list[str] = []
    allergens: list[str] = []
    household_size: int = 1
    default_spice: str = "all"


class UserResponse(BaseModel):
    """用户信息响应"""
    id: int
    username: str
    nickname: str
    avatar: str
    signature: str
    is_admin: bool = False
    is_active: bool = True
    created_at: str = ""
    last_login: str = ""


class FavoriteRequest(BaseModel):
    """收藏请求"""
    dish_id: int


class ShoppingItemRequest(BaseModel):
    id: str
    name: str
    amount: str = ""
    dish_id: str = "manual"
    dish_name: str = "手动添加"
    checked: bool = False


class ShoppingListRequest(BaseModel):
    items: list[ShoppingItemRequest] = []
