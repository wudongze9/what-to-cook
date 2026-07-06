# 今天吃什么项目文档

## 1. 项目概述

“今天吃什么”是一个面向日常做饭场景的微信小程序。项目通过“摇一摇”随机推荐菜品，帮助用户解决选菜困难，并提供菜品详情、烹饪步骤、教学视频、收藏历史和 AI 做菜问答等功能。

项目由三部分组成：

- 微信小程序前端：位于 `miniprogram/`，负责用户交互、页面展示、本地缓存和调用后端接口。
- FastAPI 后端：位于 `backend/`，负责菜品、视频、随机推荐和 AI 问答接口。
- 静态设计稿/原型资源：位于 `pages/`、`partials/`、`assets/`，用于展示早期页面设计和视觉素材。

## 2. 技术栈

### 小程序端

- 微信小程序原生开发
- WXML / WXSS / JavaScript
- 自定义 tabBar
- 本地存储：`wx.getStorageSync`、`wx.setStorageSync`
- 接口请求：`wx.request`

### 后端

- Python
- FastAPI
- Pydantic
- Uvicorn

后端依赖声明在 `backend/requirements.txt`：

```txt
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
pydantic>=2.0.0
```

## 3. 目录结构

```txt
what-to-cook/
├─ miniprogram/                 # 微信小程序源码
│  ├─ app.js                    # 小程序全局初始化和 globalData
│  ├─ app.json                  # 页面、窗口、tabBar 等配置
│  ├─ app.wxss                  # 全局样式
│  ├─ pages/                    # 页面
│  │  ├─ index/                 # 首页：摇一摇推荐菜品
│  │  ├─ result/                # 推荐结果页
│  │  ├─ steps/                 # 做菜步骤页
│  │  ├─ videos/                # 教学视频列表页
│  │  ├─ video-player/          # 视频播放详情页
│  │  ├─ chat/                  # AI 问答页
│  │  └─ profile/               # 我的：历史、收藏、关于
│  ├─ components/               # 小程序组件
│  │  ├─ food-wheel/            # 摇一摇/老虎机式推荐组件
│  │  ├─ video-card/            # 视频卡片组件
│  │  ├─ step-item/             # 步骤项组件
│  │  └─ chat-bubble/           # 聊天气泡组件
│  ├─ custom-tab-bar/           # 自定义底部导航栏
│  ├─ mock/                     # 小程序本地 mock 数据
│  └─ utils/                    # 工具层：API、本地存储、AI 服务、随机逻辑
├─ backend/                     # FastAPI 后端
│  ├─ main.py                   # FastAPI 应用入口
│  └─ app/
│     ├─ data/                  # 菜品和视频数据
│     ├─ models/                # Pydantic 数据模型
│     ├─ routers/               # API 路由
│     └─ services/              # 业务服务：随机推荐、AI 问答
├─ pages/                       # HTML 静态页面原型
├─ partials/                    # HTML 片段
├─ assets/                      # 静态图片素材
├─ project.config.json          # 微信开发者工具项目配置
└─ sitemap.json                 # 小程序 sitemap 配置
```

## 4. 小程序页面说明

### 首页：`miniprogram/pages/index`

核心功能是“摇一摇”推荐菜品。用户可以选择：

- 菜系或分类
- 辣度
- 食材数量
- 食材类型

点击推荐后，页面调用 `utils/api.js` 中的 `shuffleDish(options)`，获取后端返回的推荐结果，并将当前菜品写入：

```js
app.globalData.currentDish
app.globalData.matchedDishes
```

随后跳转到结果页。

### 结果页：`miniprogram/pages/result`

展示当前推荐菜品的核心信息，包括菜名、分类、难度、耗时、热量、食材、提示和候选菜品。

主要操作：

- 收藏/取消收藏
- 切换候选菜品
- 开始做菜，进入步骤页
- 查看教学视频
- 向 AI 助手提问

### 步骤页：`miniprogram/pages/steps`

展示当前菜品的食材清单和分步骤做法。页面维护当前步骤、进度百分比和食材勾选状态。

主要操作：

- 勾选食材
- 上一步/下一步
- 完成后写入历史记录
- 跳转 AI 问答，询问当前步骤相关问题

### 视频页：`miniprogram/pages/videos`

展示教学视频列表，支持按分类筛选。接口数据来自 `getVideoList(category)` 和 `getVideoCategories()`。

### 视频播放页：`miniprogram/pages/video-player`

根据 `videoId` 获取视频详情和相关推荐。当前数据结构中保留了 `videoUrl` 字段，后续可以接入真实视频地址。

### AI 问答页：`miniprogram/pages/chat`

提供做菜问题问答、快捷问题和简单上下文记录。

页面会读取：

- 本地聊天历史
- 快捷问题列表
- 其他页面写入的 `app.globalData.pendingQuestion`

当前 AI 能力主要是规则匹配和 mock 回复，后续可以替换为真实大模型接口。

### 我的页：`miniprogram/pages/profile`

展示历史记录、收藏列表和关于信息。

注意：该页面查看菜品详情时当前直接读取 `mock/dishes`，而不是调用后端接口。这在纯后端模式下可能导致数据源不统一，后续建议改为复用 `getDishDetail()`。

## 5. 小程序工具层

### API 层：`miniprogram/utils/api.js`

统一封装小程序到后端的请求。

当前基础地址：

```js
const BASE_URL = 'http://localhost:8001/api'
const USE_API = true
```

主要方法：

- `getCategories()`：获取菜品分类
- `shuffleDish(options)`：随机推荐菜品
- `getDishDetail(dishId)`：获取菜品详情
- `getDishList(category)`：获取菜品列表
- `getVideoList(category)`：获取视频列表
- `getVideoCategories()`：获取视频分类
- `getVideoDetail(videoId)`：获取视频详情
- `sendChatMessage(message, context)`：发送 AI 问答消息
- `getQuickQuestions()`：获取快捷问题
- `getCuisineTypes()`：获取菜系类型
- `getSpiceLevels()`：获取辣度等级

### 本地存储：`miniprogram/utils/storage.js`

封装本地缓存读写。

主要存储键：

- `dishHistory`：推荐/做菜历史
- `favorites`：收藏菜品
- `chatMessages`：聊天记录
- `userPreferences`：用户偏好，当前预留

主要方法：

- `addToHistory(dish)`：添加历史记录，最多保留 50 条
- `toggleFavorite(dish)`：收藏或取消收藏
- `saveChatMessage(message)`：保存聊天记录，最多保留 200 条
- `getChatHistory()`：读取聊天记录

### AI 服务：`miniprogram/utils/ai-service.js`

当前包含两个方向：

- `callAI(userMessage, context)`：本地 mock AI 回复
- `startVoiceRecognition()`：录音模拟语音识别流程，后续需要接入真实 ASR 服务

## 6. 后端结构说明

### 应用入口：`backend/main.py`

创建 FastAPI 应用，配置 CORS，并注册三个路由模块：

- `dishes.router`：菜品接口
- `videos.router`：视频接口
- `chat.router`：AI 问答接口

健康检查接口：

```http
GET /api/health
```

### 数据模型：`backend/app/models/schemas.py`

核心模型：

- `Step`：烹饪步骤
- `Dish`：完整菜品
- `DishBrief`：菜品简略信息
- `ShuffleResult`：随机推荐结果
- `Video`：视频信息
- `ChatRequest`：聊天请求
- `ChatResponse`：聊天响应

### 菜品数据：`backend/app/data/dishes.py`

包含：

- `dishes`：菜品列表
- `all_ingredients`：可随机抽取的食材池
- `get_categories()`：从菜品数据中提取分类

### 视频数据：`backend/app/data/videos.py`

包含：

- `videos`：视频列表
- `video_categories`：视频分类

### 随机推荐服务：`backend/app/services/shuffle.py`

核心逻辑：

1. 根据食材数量和食材类型，从食材池中随机抽取食材。
2. 根据选中的食材与菜品食材做匹配评分。
3. 可按菜系分类过滤候选菜品。
4. 返回 Top 3 匹配菜品，其中第一个作为主推荐。

推荐结果结构：

```json
{
  "selected_ingredients": [],
  "matched_dish": {},
  "matched_dishes": []
}
```

### AI 问答服务：`backend/app/services/ai_chat.py`

当前为规则匹配式问答：

- 先根据关键词匹配做菜技巧类回答。
- 再根据菜名匹配菜品做法。
- 如果都没有命中，则返回默认回复。

文件中已经预留真实大模型 API 替换位置。

## 7. 后端 API 文档

### 健康检查

```http
GET /api/health
```

返回：

```json
{
  "status": "ok",
  "service": "今天吃什么"
}
```

### 获取菜品分类

```http
GET /api/dishes/categories
```

返回：

```json
{
  "categories": ["全部", "家常菜"]
}
```

### 获取全部食材

```http
GET /api/dishes/ingredients
```

返回：

```json
{
  "ingredients": []
}
```

### 获取菜品列表

```http
GET /api/dishes
GET /api/dishes?category=家常菜
```

返回：

```json
{
  "dishes": [],
  "total": 10
}
```

### 随机推荐菜品

```http
GET /api/dishes/random
GET /api/dishes/random?category=家常菜&count=3&type=all
```

参数：

- `category`：菜品分类，可选
- `count`：随机食材数量，范围 2-4，默认 3
- `type`：食材类型，默认 `all`

返回：

```json
{
  "selected_ingredients": [],
  "matched_dish": {},
  "matched_dishes": []
}
```

### 获取菜品详情

```http
GET /api/dishes/{dish_id}
```

返回：

```json
{
  "dish": {}
}
```

### 获取菜品步骤

```http
GET /api/dishes/{dish_id}/steps
```

返回：

```json
{
  "dish_id": 1,
  "steps": [],
  "tips": ""
}
```

### 获取视频分类

```http
GET /api/videos/categories
```

返回：

```json
{
  "categories": []
}
```

### 获取视频列表

```http
GET /api/videos
GET /api/videos?category=家常菜
```

返回：

```json
{
  "featured": {},
  "videos": [],
  "total": 8
}
```

### 获取视频详情

```http
GET /api/videos/{video_id}
```

返回：

```json
{
  "video": {},
  "related": []
}
```

### AI 问答

```http
POST /api/chat
```

请求：

```json
{
  "message": "番茄炒蛋怎么做",
  "context": []
}
```

返回：

```json
{
  "reply": "..."
}
```

### 获取快捷问题

```http
GET /api/chat/quick-questions
```

返回：

```json
{
  "questions": []
}
```

## 8. 核心业务流程

### 摇一摇推荐流程

```txt
用户进入首页
  ↓
选择菜系、辣度、食材数量、食材类型
  ↓
点击摇一摇
  ↓
food-wheel 组件播放动画
  ↓
首页调用 shuffleDish(options)
  ↓
后端 /api/dishes/random 随机抽取食材并匹配菜品
  ↓
返回主推荐菜品和候选菜品
  ↓
写入 app.globalData.currentDish 和 matchedDishes
  ↓
跳转结果页
```

### 做菜流程

```txt
结果页点击开始做菜
  ↓
进入 steps 页面
  ↓
展示食材和步骤
  ↓
用户逐步完成
  ↓
完成后写入 dishHistory
```

### AI 问答流程

```txt
用户在 chat 页面输入问题
  ↓
页面保存用户消息
  ↓
调用 sendChatMessage(message, context)
  ↓
后端 /api/chat 根据关键词或菜名生成回复
  ↓
页面展示 AI 回复并写入聊天记录
```

## 9. 运行方式

### 启动后端

进入后端目录：

```bash
cd backend
```

安装依赖：

```bash
pip install -r requirements.txt
```

启动服务：

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

启动后可访问：

```txt
http://localhost:8001/api/health
http://localhost:8001/docs
```

### 启动小程序

1. 打开微信开发者工具。
2. 导入项目根目录 `what-to-cook`。
3. 确认 `project.config.json` 中的 `miniprogramRoot` 为 `miniprogram/`。
4. 确认后端已运行在 `http://localhost:8001`。
5. 编译运行。

如果在真机调试，需要将 `miniprogram/utils/api.js` 中的 `BASE_URL` 改成局域网可访问地址或线上 HTTPS 地址，并在小程序后台配置 request 合法域名。

## 10. 当前状态与验证结果

已做过基础解析检查：

- `miniprogram/app.json` 可以正常 JSON 解析。
- 后端 Python 文件可以正常编译。
- 小程序 JS 文件可以通过语法检查。
- 后端核心接口可以通过 FastAPI TestClient 返回数据。

已验证接口：

- `GET /api/health`
- `GET /api/dishes/categories`
- `GET /api/dishes/random`
- `GET /api/videos`
- `GET /api/chat/quick-questions`
- `POST /api/chat`

## 11. 已知注意点

1. `BASE_URL` 当前写死为 `http://localhost:8001/api`，适合本地开发，不适合真机或线上环境。
2. `USE_API = true` 时小程序默认调用后端，如果后端没有启动，请求会失败。
3. `profile` 页面查看菜品详情时仍读取本地 mock 数据，建议改为后端接口，避免数据不一致。
4. 视频数据中 `videoUrl` 目前为空，视频播放功能需要接入真实视频地址。
5. AI 问答当前是规则匹配，不是真实大模型。后续可以在 `backend/app/services/ai_chat.py` 中接入 DeepSeek、通义千问、OpenAI 等模型 API。
6. 语音识别当前是录音流程演示，没有接入真实 ASR 服务。
7. PowerShell 默认编码可能导致中文在终端输出时显示为乱码，但项目文件用 UTF-8 读取时中文内容是正常的。

## 12. 后续优化建议

### 工程化

- 将 `BASE_URL` 改为环境配置，区分本地、测试和生产环境。
- 增加后端单元测试，覆盖随机推荐、菜品详情、视频详情和 AI 问答。
- 为小程序 API 调用增加统一错误提示和 loading 状态。

### 数据层

- 将菜品和视频数据迁移到数据库，例如 SQLite、PostgreSQL 或云开发数据库。
- 为菜品增加图片、标签、口味、适合人群、营养信息等字段。
- 为用户偏好增加持久化能力，例如不吃辣、忌口、健身减脂等。

### 推荐算法

- 当前推荐主要基于食材匹配分数。
- 后续可以加入用户历史、收藏、口味偏好、季节、时间段等因素。
- 可以支持“冰箱里有什么就做什么”的输入式推荐。

### AI 能力

- 接入真实大模型 API，支持更自然的做菜问答。
- 将当前菜品、当前步骤、用户偏好作为上下文传给模型。
- 增加菜谱生成、食材替换、热量估算和失败补救建议。

### 产品体验

- 增加真实菜品图片和视频封面。
- 增加菜品搜索。
- 增加收藏夹分类。
- 增加“今天不想吃这个，换一个”的快速反馈。
- 增加做菜计时器和步骤提醒。

