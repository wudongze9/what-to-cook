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