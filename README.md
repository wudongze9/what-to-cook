# 🍳 WhatToCook

> 今天吃什么 — 拉下摇杆，把冰箱里的可能性变成一道菜。

**WhatToCook** 是一个解决"今天吃什么"世纪难题的微信小程序。通过老虎机式摇杆随机抽取食材组合，智能匹配菜品，并提供完整的做菜步骤、视频教学、AI 数字人问答和用户系统，手把手教你完成一道菜。

---

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 🎰 摇杆机选菜 | 老虎机式滚轮动画，随机抽取食材组合，匹配出最佳菜品 |
| 🎯 四维筛选 | 食材个数（2/3/4）× 食材种类 × 菜系（17 种）× 口味（8 档）任意组合 |
| 📋 做菜步骤 | 时间线式分步指导，支持食材勾选清单和进度追踪 |
| 🎬 视频教学 | 一菜多视频，100 道菜全覆盖；外链跳转（B站/抖音/小红书）+ 可播放 mp4 双模式 |
| 🤖 AI 数字人问答 | 本地 Ollama qwen3.5 大模型 + 长按语音输入 + TTS 语音播报 + 数字人动效 |
| 👤 用户系统 | 账号密码注册登录 + 微信一键登录，JWT 鉴权 |
| 🛡️ 后台用户管理 | 管理员可在小程序内管理用户（列表/搜索/禁用/删除/重置密码） |
| ❤️ 收藏与历史 | 登录后云端同步，未登录本地存储 |
| 🎨 自定义视觉 | 80+ SVG 食材图标、渐变动效、自定义 TabBar |

---

## 🛠 技术栈

### 前端（微信小程序原生）

```
WXML + WXSS + JavaScript (ES6+)
自定义 Component / 自定义 TabBar
wx.request 网络请求（自动注入 JWT Authorization 头）
wx.getStorageSync 本地存储
wx.getRecorderManager 长按录音
wx.createInnerAudioContext TTS 音频播放
CSS Variables 设计系统 + 纯 CSS 数字人动效
```

### 后端（Python FastAPI）

```
Python 3.10+
FastAPI + Uvicorn（热重载）
Pydantic 数据校验
JWT 认证（PyJWT + bcrypt 密码哈希）
CORS 跨域支持
SQLite 数据库（10 张表）
edge-tts 微软免费语音合成
Ollama 本地大模型集成（qwen3.5:0.8b）
httpx 异步 HTTP 客户端（trust_env=False 绕过代理）
```

### 数据

```
100 道菜品（涵盖 17 大菜系）
100 条教学视频（每道菜绑定一个外部教学视频链接）
160+ 种食材（6 大分类，含用量信息）
80+ SVG 原创图标
10 张数据库表（菜品 6 张 + 用户 3 张 + 视频 1 张）
```

---

## 📁 项目结构

```
what-to-cook/
├── miniprogram/                    # 微信小程序前端
│   ├── app.js                      # 全局入口，初始化登录态恢复
│   ├── app.json                    # 页面路由、窗口、TabBar 配置（9 个页面）
│   ├── app.wxss                    # 全局样式与设计系统（CSS 变量）
│   │
│   ├── pages/                      # 9 个页面
│   │   ├── index/                  # 首页：摇杆机 + 配置面板 + 登录引导
│   │   ├── result/                 # 结果页：菜品详情 + 食材组合 + 可替换食材
│   │   ├── steps/                  # 步骤页：时间线 + 食材清单
│   │   ├── videos/                 # 视频列表页
│   │   ├── video-player/           # 视频播放页
│   │   ├── chat/                   # AI 数字人问答页（数字人动效+录音+TTS）
│   │   ├── profile/                # 个人中心：登录态展示 + 收藏/历史云同步
│   │   ├── login/                  # 登录注册页（账号密码 + 微信登录）
│   │   └── admin/                  # 管理员用户管理页
│   │
│   ├── components/                 # 4 个自定义组件
│   │   ├── food-wheel/             # 摇杆机组件（核心交互）
│   │   ├── step-item/              # 步骤项组件
│   │   ├── video-card/             # 视频卡片组件
│   │   └── chat-bubble/            # 聊天气泡组件
│   │
│   ├── custom-tab-bar/             # 自定义底部导航
│   ├── utils/                      # 工具层
│   │   ├── api.js                  # API 服务层（后端/Mock 双通道 + JWT 注入）
│   │   ├── shuffle.js              # 摇一摇算法（本地降级版）
│   │   ├── storage.js              # 本地存储封装（含 TOKEN/USER_INFO 登录态）
│   │   ├── icon-map.js             # 食材 → SVG 图标映射
│   │   ├── ai-service.js           # AI 服务（Ollama 对话 + 录音 + TTS）
│   │   ├── ingredient-tools.js     # 食材工具函数
│   │   └── video-match.js          # 视频与菜品匹配规范化
│   ├── mock/                       # 本地 Mock 数据
│   │   ├── dishes.js               # 100 道菜品 + 160+ 食材
│   │   ├── dish-videos.js          # 100 条菜品教学视频（一菜多视频）
│   │   ├── videos.js               # 旧版视频数据（兼容）
│   │   └── ai-replies.js           # AI 回复规则（降级用）
│   └── images/icons/               # 80+ SVG 食材图标
│
├── backend/                        # FastAPI 后端
│   ├── main.py                     # 应用入口，注册 6 个路由 + 启动建表
│   ├── requirements.txt            # Python 依赖
│   ├── migrate.py                  # JSON → SQLite 数据迁移脚本（含视频导入）
│   ├── gen_videos.py               # 生成 dish-videos.json + 前端 mock 脚本
│   ├── check_videos.py             # 视频链接可访问性检查脚本
│   ├── gen_mock.py                 # 生成前端 mock 数据脚本
│   ├── upgrade_data.py             # 数据升级脚本
│   ├── whattocook.db               # SQLite 数据库文件
│   ├── static/audio/               # TTS 生成的 mp3 缓存
│   └── app/
│       ├── database.py             # 数据访问层（菜品 + 用户收藏/历史 + 视频）
│       ├── deps.py                 # 认证依赖注入（get_current_user/require_admin）
│       ├── data/                   # 数据层
│       │   ├── schema.sql          # 10 张表结构（6 菜品 + 3 用户 + 1 视频）
│       │   ├── dishes-data.json    # 100 道菜品完整数据
│       │   ├── dish-videos.json    # 100 条菜品教学视频种子数据
│       │   ├── dishes.py           # 菜品数据（Python 模块）
│       │   ├── videos.py           # 旧版视频数据
│       │   ├── collection-template.json    # 数据采集模板
│       │   └── dishes-collection-sample.json  # 采集样本
│       ├── models/
│       │   └── schemas.py          # Pydantic 数据模型（含用户认证模型）
│       ├── routers/                # API 路由（6 个模块）
│       │   ├── dishes.py           # 菜品接口
│       │   ├── videos.py           # 视频接口
│       │   ├── chat.py             # AI 问答 + TTS 接口
│       │   ├── auth.py             # 用户认证（注册/登录/微信登录/资料/密码）
│       │   ├── admin.py            # 管理员用户管理
│       │   └── user_data.py        # 用户收藏/历史
│       └── services/               # 业务服务
│           ├── shuffle.py          # 随机推荐算法
│           ├── ai_chat.py          # Ollama qwen3.5 对话服务
│           ├── tts_service.py      # edge-tts 语音合成
│           └── auth_service.py     # 用户认证服务（JWT/bcrypt/微信登录）
│
├── project.config.json             # 微信开发者工具配置（urlCheck: false）
└── sitemap.json                    # 小程序 sitemap
```

---

## 🔄 核心流程实现

### 1. 摇杆机选菜流程

```
用户进入首页
    │
    ▼
配置筛选条件
    │  ├── 食材个数：2 / 3 / 4
    │  ├── 食材种类：蔬菜 / 肉禽 / 海鲜 / 蛋豆 / 主食 / 调味
    │  ├── 目标菜系：家常菜 / 川菜 / 粤菜 / 湘菜 / 东北菜 ...
    │  └── 口味程度：清淡 / 微辣 / 中辣 / 重辣 / 甜口 / 酸口 / 咸鲜
    │
    ▼
点击摇杆 / 按钮
    │
    ▼
food-wheel 组件启动滚轮动画
    │  ├── 每个槽位独立 setInterval 快速切换食材
    │  ├── 逐个槽位延迟停止
    │  └── 摇杆下压回弹 + 灯光闪烁动画
    │
    ▼
动画结束，触发 spinend 事件
    │
    ▼
首页调用 shuffleDish(options)
    │
    ▼
API 层判断 USE_API
    ├── true  →  POST /api/dishes/random（携带 selected_ingredients）
    └── false →  本地 shuffle.js performShuffle()
    │
    ▼
后端 match_dishes_by_ingredients() 执行 SQL JOIN
    │  1. JOIN dish_ingredients + ingredients 匹配命中食材
    │  2. 按菜系 + 口味双重过滤
    │  3. 评分：score = 命中食材数 - 额外食材数 × 0.3
    │  4. 返回 Top 3 匹配菜品
    │
    ▼
跳转结果页展示
```

**关键代码位置：**
- 摇杆机组件：[miniprogram/components/food-wheel/food-wheel.js](miniprogram/components/food-wheel/food-wheel.js)
- 首页逻辑：[miniprogram/pages/index/index.js](miniprogram/pages/index/index.js)
- 本地算法：[miniprogram/utils/shuffle.js](miniprogram/utils/shuffle.js)
- 后端算法：[backend/app/database.py](backend/app/database.py)（`match_dishes_by_ingredients`）

---

### 2. AI 数字人问答流程

```
用户进入 chat 页面
    │
    ▼
展示数字人头像（呼吸/眨眼/说话微动 CSS 动效）
    │
    ├── 文字输入：用户键入问题
    ├── 快捷问题：点击预设问题
    └── 语音输入：长按麦克风按钮录音
    │
    ▼
调用 sendChatMessage(message, context)
    │  └── context 携带最近 6 条对话
    │
    ▼
后端 /api/chat 接收请求
    │
    ▼
ai_chat.py 调用本地 Ollama qwen3.5:0.8b
    │  ├── payload: { model, messages, think: false }
    │  ├── httpx.AsyncClient(trust_env=False) 绕过系统代理
    │  └── 超时 120s
    │
    ├── Ollama 可用  ──→  返回 AI 回复
    └── Ollama 不可用  ──→  降级到本地关键词匹配
    │
    ▼
前端展示回复 + 可选 TTS 播报
    │  ├── 点击"语音播报"按钮
    │  ├── POST /api/chat/tts（edge-tts zh-CN-XiaoyiNeural 女声）
    │  └── wx.createInnerAudioContext 播放 mp3
    │
    ▼
数字人头像切换为"说话"动效
```

**关键代码位置：**
- 数字人 UI：[miniprogram/pages/chat/chat.wxml](miniprogram/pages/chat/chat.wxml) + [chat.wxss](miniprogram/pages/chat/chat.wxss)
- 录音 + TTS：[miniprogram/utils/ai-service.js](miniprogram/utils/ai-service.js)
- 后端 AI：[backend/app/services/ai_chat.py](backend/app/services/ai_chat.py)
- 后端 TTS：[backend/app/services/tts_service.py](backend/app/services/tts_service.py)

---

### 3. 用户认证流程

```
用户点击"去登录"
    │
    ▼
进入 login 页面
    │  ├── 登录模式：用户名 + 密码
    ├── 注册模式：用户名 + 昵称 + 密码
    └── 微信登录：wx.login() 获取 code
    │
    ▼
调用对应 API
    ├── POST /api/auth/register   账号密码注册
    ├── POST /api/auth/login      账号密码登录
    └── POST /api/auth/wx-login   微信登录
    │
    ▼
后端 auth_service 验证
    │  ├── 注册：bcrypt 哈希密码，首个用户自动 is_admin=1
    ├── 登录：bcrypt 验证密码，更新 last_login
    └── 微信登录：code → openid（开发期降级为 code 哈希）
    │
    ▼
生成 JWT token（72 小时有效）
    │
    ▼
前端 storage.js 保存 token + userInfo
    │
    ▼
后续请求 api.js 自动注入 Authorization: Bearer <token>
    │
    ▼
后端 deps.py 依赖注入校验 token
    ├── get_current_user          要求登录
    ├── get_current_user_optional 可选登录
    └── require_admin             要求管理员
```

**关键代码位置：**
- 登录页：[miniprogram/pages/login/login.js](miniprogram/pages/login/login.js)
- 认证服务：[backend/app/services/auth_service.py](backend/app/services/auth_service.py)
- 依赖注入：[backend/app/deps.py](backend/app/deps.py)
- 前端登录态：[miniprogram/utils/storage.js](miniprogram/utils/storage.js)

---

### 4. 前后端降级策略

```
api.js withFallback(apiFn, fallbackFn)
    │
    ├── USE_API = false  ──→  直接执行本地 Mock
    │
    └── USE_API = true
            │
            ├── 请求成功  ──→  返回后端数据
            │
            └── 请求失败  ──→  自动降级到本地 Mock
                                └── 控制台打印 [api fallback] 警告
```

所有接口（菜品 / 视频 / 问答 / 菜系 / 口味）均走此模式，保证后端不可用时小程序仍可完整运行。用户认证相关接口不走降级，未登录时使用本地存储的收藏和历史。

---

## 📡 后端 API 文档

启动后端后访问 `http://localhost:8001/docs` 可查看交互式文档。

### 菜品接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dishes/categories` | 菜系分类列表 |
| GET | `/api/dishes/cuisines` | 菜系列表（英文 key + 中文名） |
| GET | `/api/dishes/tags` | 所有标签 |
| GET | `/api/dishes/ingredients` | 所有食材 |
| GET | `/api/dishes/spice-levels` | 口味程度列表 |
| GET | `/api/dishes` | 菜品列表（支持 `?category=`） |
| GET | `/api/dishes/random` | 摇一摇推荐（GET 兜底） |
| POST | `/api/dishes/random` | 摇一摇推荐（POST 携带 selected_ingredients） |
| GET | `/api/dishes/{id}` | 菜品详情 |
| GET | `/api/dishes/{id}/steps` | 菜品步骤 |

### 视频接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/videos/categories` | 视频分类（兼容旧版） |
| GET | `/api/videos` | 视频列表（支持 `?category=`，兼容旧版） |
| GET | `/api/videos/all/list` | 所有菜品教学视频（新版，支持 `?category=`） |
| GET | `/api/videos/dish/{dish_id}` | 按菜品 ID 查询所有教学视频（一菜多视频） |
| GET | `/api/videos/sources/list` | 所有视频来源平台（bilibili/douyin/...） |
| GET | `/api/videos/{video_id}` | 视频详情（优先查 dish_videos 表，回退旧版） |
| POST | `/api/videos/admin/add` | 新增视频（管理员） |
| DELETE | `/api/videos/admin/{video_id}` | 删除视频（管理员） |

### AI 问答接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | 发送问题，返回 AI 回复（Ollama qwen3.5） |
| GET | `/api/chat/quick-questions` | 快捷问题列表 |
| POST | `/api/chat/tts` | 文本转语音（edge-tts 中文女声） |
| GET | `/api/chat/tts-file/{filename}` | 获取 TTS 音频文件 |

### 用户认证接口

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/auth/register` | 账号密码注册 | 公开 |
| POST | `/api/auth/login` | 账号密码登录 | 公开 |
| POST | `/api/auth/wx-login` | 微信登录 | 公开 |
| GET | `/api/auth/me` | 获取当前用户信息 | 需登录 |
| PUT | `/api/auth/profile` | 更新昵称/头像/签名 | 需登录 |
| PUT | `/api/auth/password` | 修改密码 | 需登录 |

### 用户数据接口（收藏/历史）

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/user/favorites` | 我的收藏列表 | 需登录 |
| POST | `/api/user/favorites` | 添加收藏 | 需登录 |
| DELETE | `/api/user/favorites/{dish_id}` | 取消收藏 | 需登录 |
| GET | `/api/user/favorites/{dish_id}/check` | 检查是否已收藏 | 需登录 |
| POST | `/api/user/history` | 添加历史 | 需登录 |
| GET | `/api/user/history` | 历史列表 | 需登录 |
| DELETE | `/api/user/history` | 清空历史 | 需登录 |

### 管理员接口

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/admin/users` | 用户列表（分页+搜索） | 管理员 |
| PUT | `/api/admin/users/{id}/toggle` | 启用/禁用用户 | 管理员 |
| PUT | `/api/admin/users/{id}/admin` | 设置/取消管理员 | 管理员 |
| PUT | `/api/admin/users/{id}/password` | 重置密码为 123456 | 管理员 |
| DELETE | `/api/admin/users/{id}` | 删除用户 | 管理员 |

### 示例：摇一摇请求

```http
POST /api/dishes/random
Content-Type: application/json

{
  "selected_ingredients": ["番茄", "鸡蛋", "葱"],
  "category": "家常菜",
  "spice_level": "不辣"
}
```

```json
{
  "selected_ingredients": [
    { "name": "番茄", "emoji": "🍅" },
    { "name": "鸡蛋", "emoji": "🥚" },
    { "name": "葱", "emoji": "🧅" }
  ],
  "matched_dish": {
    "id": 1,
    "name": "番茄炒蛋",
    "category": "家常菜",
    "difficulty": "简单",
    "time": 10,
    "calories": 180,
    "ingredients": [{"name": "番茄", "amount": "2个"}, ...],
    "steps": [...]
  },
  "matched_dishes": ["..."]
}
```

### 示例：用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "chefwang",
  "password": "123456",
  "nickname": "王大厨"
}
```

```json
{
  "message": "注册成功",
  "user": {
    "id": 1,
    "username": "chefwang",
    "nickname": "王大厨",
    "is_admin": true,
    "..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 🗄 数据库设计

共 10 张表（6 菜品相关 + 3 用户相关 + 1 视频相关）：

```
菜品相关：
├── categories          菜系分类
├── ingredient_types    食材类型
├── ingredients         食材库
├── dishes              菜品主表（含 cuisine/tags/cover/营养字段）
├── dish_ingredients    菜品-食材关联（多对多，含 amount）
└── dish_steps          菜品步骤

用户相关：
├── users               用户表（username/password_hash/nickname/wx_openid/is_admin）
├── user_favorites      用户收藏（user_id + dish_id 唯一约束）
└── user_history        用户推荐历史

视频相关：
└── dish_videos         菜品教学视频（一菜多视频，外链为主）
                         字段：id/dish_id/dish_name/title/category/tags/cover/
                              duration/source/author/external_url/video_url/
                              playable_in_miniprogram/description
```

完整表结构见 [backend/app/data/schema.sql](backend/app/data/schema.sql)。

---

## 🚀 快速开始

### 环境要求

- 微信开发者工具（最新稳定版）
- Python 3.10+（推荐使用 Conda）
- Ollama（可选，用于 AI 问答，已下载 qwen3.5:0.8b 模型）

### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt
# 额外依赖（auth + ai + tts）
pip install pyjwt bcrypt httpx edge-tts

# 启动（支持热重载）
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

验证：

```bash
curl http://localhost:8001/api/health
# {"status":"ok","service":"今天吃什么"}
```

交互式文档：`http://localhost:8001/docs`

### 2. 启动 Ollama（可选，AI 问答用）

```bash
# 安装 Ollama 后下载模型
ollama pull qwen3.5:0.8b

# 启动 Ollama 服务（默认 127.0.0.1:11434）
ollama serve
```

> 未启动 Ollama 时，AI 问答会自动降级到本地关键词匹配。

### 3. 启动小程序

1. 打开微信开发者工具
2. 导入项目，选择根目录 `what-to-cook`（**不是** `miniprogram/` 目录）
3. 确认 `project.config.json` 中 `miniprogramRoot` 为 `miniprogram/`
4. **重要**：在「详情 - 本地设置」中勾选「不校验合法域名、web-view、TLS 版本及 HTTPS 证书」（用于访问 localhost）
5. 编译运行（Ctrl+B）

### 4. 前后端联调

编辑 [miniprogram/utils/api.js](miniprogram/utils/api.js)：

```javascript
const USE_API = true  // true 启用后端，false 走本地 Mock
```

> 真机调试需将 `BASE_URL` 改为 HTTPS 域名，并在小程序后台配置 request 合法域名。

### 5. 体验用户系统

1. 进入「我的」页面 → 点击「点击登录」
2. 切换到「注册」标签 → 填写用户名/昵称/密码 → 注册
3. **首个注册的用户自动成为管理员**
4. 登录后可享受云端收藏/历史同步
5. 管理员在「我的」页面底部可见「用户管理」入口

---

## 🎨 设计系统

### 色彩

| 变量 | 色值 | 用途 |
|------|------|------|
| `--color-primary` | `#FF6B1A` | 主色（橙） |
| `--color-accent` | `#FF3D6E` | 强调色（粉红） |
| `--color-ink` | `#2A1735` | 主文字 |
| `--color-bg` | `#FFF7F0` | 背景 |
| `--color-surface` | `#FFFFFF` | 卡片表面 |
| `--color-border` | `#FFD7C2` | 边框 |

### 圆角与阴影

- 卡片：`28rpx`
- 胶囊按钮：`999rpx`
- `--shadow-card`：`0 18rpx 48rpx rgba(91, 43, 111, 0.10)`
- `--shadow-pop`：`0 18rpx 42rpx rgba(255, 107, 26, 0.28)`

### 动效

- 摇杆下压回弹动画
- 滚轮逐个定格减速
- 灯光呼吸 / 闪烁
- 按钮扫光效果
- 卡片渐入、标签弹出
- 数字人呼吸 / 眨眼 / 说话微动（纯 CSS）

---

## 📊 数据概览

### 菜品分布（100 道）

| 菜系 | 数量 | 代表菜 |
|------|------|--------|
| 家常菜 | 20+ | 番茄炒蛋、红烧肉、可乐鸡翅 |
| 川菜 | 10+ | 宫保鸡丁、麻婆豆腐、水煮牛肉、回锅肉 |
| 粤菜 | 8+ | 清蒸鲈鱼、白切鸡、蚝油生菜 |
| 湘菜 | 6+ | 剁椒鱼头、小炒黄牛肉、干锅花菜 |
| 东北菜 | 5+ | 地三鲜、锅包肉 |
| 海鲜 | 8+ | 蒜蓉粉丝蒸虾、清蒸鲈鱼 |
| 汤煲 | 5+ | 紫菜蛋花汤、冬瓜排骨汤 |
| 主食 | 8+ | 蛋炒饭、炸酱面、饺子 |
| 其他 | 30+ | 鲁菜、苏菜、西餐、甜品等 |

### 食材分类（160+ 种）

| 类别 | 数量 | 示例 |
|------|------|------|
| 蔬菜 | 40+ | 番茄、土豆、西兰花、茄子 |
| 肉禽 | 25+ | 猪肉、牛肉、鸡腿、五花肉 |
| 海鲜 | 15+ | 虾、鲈鱼、螃蟹、鱿鱼 |
| 蛋豆 | 15+ | 鸡蛋、豆腐、腐竹、豌豆 |
| 主食 | 15+ | 米饭、面条、年糕、粉丝 |
| 调味 | 50+ | 蒜、葱、生抽、豆瓣酱、花椒 |

---

## 🔒 安全说明

- 密码使用 bcrypt 哈希存储（限制 72 字节）
- JWT token 有效期 72 小时，签名密钥可通过环境变量 `JWT_SECRET` 配置
- 微信登录开发期未配置 AppID 时降级为 code 哈希作临时 openid，真机上线需配置 `WX_APPID` / `WX_SECRET`
- 管理员不能禁用/删除自己，不能修改自己的管理员状态
- `project.config.json` 中 `urlCheck: false` 仅用于开发环境，上线前需配置合法域名

---

## 🎬 视频教学系统

### 设计理念：一菜多视频，外链为主

采用「菜品表 + 视频表」分离设计，不破坏原有菜品数据，每道菜可绑定多个教学视频。

### 数据结构

每条视频包含以下字段：

| 字段 | 说明 | 示例 |
|------|------|------|
| `id` | 视频条目 ID | `v_dish_029` |
| `dishId` | 绑定的菜品 ID | `29` |
| `dishName` | 菜品名（冗余） | `地三鲜` |
| `title` | 视频标题 | `地三鲜家常做法教学` |
| `category` | 所属菜系 | `东北菜` |
| `tags` | 标签数组 | `["东北菜","家常菜"]` |
| `cover` | 封面图 URL | `https://...` |
| `duration` | 时长 | `08:30` |
| `source` | 来源平台 | `bilibili` / `douyin` / `xiaohongshu` |
| `author` | UP主 | `某某厨房` |
| `externalUrl` | 外部页面链接 | `https://www.bilibili.com/video/BVxxxx` |
| `videoUrl` | 可播放 mp4/HLS | `https://...mp4` |
| `playableInMiniprogram` | 能否小程序内播放 | `false`（外链需跳转） |

### 前端展示逻辑

```
用户点击"看教学视频"
    │
    ▼
按 dishId 进入 video-player 页
    │
    ▼
查询该菜品的所有视频
    │
    ├── 无视频 → 展示空状态
    ├── 1 个视频 → 直接展示详情
    └── 多个视频 → 展示列表，点击查看
         │
         ▼
    判断 playableInMiniprogram
    ├── true  → <video> 组件直接播放 mp4
    └── false → 外链模式：复制链接到剪贴板 + 提示浏览器打开
```

### 当前数据状态

- **100 道菜全部有视频链接**（100% 覆盖）
- 当前 `externalUrl` 为 B站搜索链接占位，可替换为具体视频页 URL
- 所有链接已通过可访问性检查（`python check_videos.py`）

### 视频收集方法

1. 在 B站/抖音/小红书/YouTube 搜索菜名 + "做法"
2. 挑选清晰、步骤完整的教学视频
3. 编辑 [backend/app/data/dish-videos.json](backend/app/data/dish-videos.json)，替换对应条目的 `external_url`
4. 运行 `python migrate.py` 重新导入数据库
5. 运行 `python check_videos.py` 检查链接可访问性

### 相关文件

- 种子数据：[backend/app/data/dish-videos.json](backend/app/data/dish-videos.json)
- 生成脚本：[backend/gen_videos.py](backend/gen_videos.py)
- 检查脚本：[backend/check_videos.py](backend/check_videos.py)
- 前端降级：[miniprogram/mock/dish-videos.js](miniprogram/mock/dish-videos.js)
- 视频页：[miniprogram/pages/video-player/](miniprogram/pages/video-player/)

---

## 🔮 后续工作完善

### 短期（功能补全）

- [ ] 接入真实微信 AppID/AppSecret 实现 code2session
- [ ] 将视频外链替换为具体视频页面 URL（当前为 B站搜索链接占位）
- [ ] 菜品图片替换为真实照片
- [ ] 语音识别 ASR 对接（替换当前录音 mock）

### 中期（体验升级）

- [ ] 做菜计时器：步骤页加入倒计时提醒
- [ ] 智能推荐：基于用户历史、收藏、季节的个性化推荐
- [ ] 冰箱食材输入：拍照识别 / 手动输入已有食材
- [ ] 营养分析：热量、蛋白质、碳水等营养成分计算

### 长期（产品演进）

- [ ] 数据库迁移到 PostgreSQL 或云开发数据库
- [ ] 菜谱生成：基于随机食材组合，AI 生成全新菜谱
- [ ] 社区分享：用户上传自己的菜谱和成品图
- [ ] 多端支持：H5 / App 版本

---

## 📝 开发约定

- 前端文件命名：小写中划线（`food-wheel`、`video-player`）
- 后端文件命名：小写下划线（`ai_chat.py`、`auth_service.py`）
- CSS 变量统一通过 `app.wxss` 的 `page` 选择器定义
- 食材图标统一走 `icon-map.js` 的三层匹配机制
- API 层所有方法支持 `withFallback` 双通道降级
- 用户认证接口通过 `Depends(get_current_user)` 鉴权
- 首个注册用户自动成为管理员
- 数据库操作统一通过 `database.py` 封装，不直接在路由中写 SQL

---

## 📄 License

MIT License - 仅供学习和个人使用。

---

> 💡 如果这个项目对你有帮助，欢迎 Star ⭐
