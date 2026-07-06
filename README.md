# 🍳 WhatToCook

> 今天吃什么 — 拉下摇杆，把冰箱里的可能性变成一道菜。

**WhatToCook** 是一个解决"今天吃什么"世纪难题的微信小程序。通过老虎机式摇杆随机抽取食材组合，智能匹配菜品，并提供完整的做菜步骤、视频教学和 AI 数字人问答，手把手教你完成一道菜。

---

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 🎰 摇杆机选菜 | 老虎机式滚轮动画，随机抽取食材组合，匹配出最佳菜品 |
| 🎯 四维筛选 | 食材个数（2/3/4）× 食材种类 × 菜系（12 种）× 口味（8 档）任意组合 |
| 📋 做菜步骤 | 时间线式分步指导，支持食材勾选清单和进度追踪 |
| 🎬 视频教学 | 按菜系分类的教学视频列表 |
| 🤖 AI 数字人问答 | 做菜问题实时问答，支持上下文理解和快捷问题 |
| ❤️ 收藏与历史 | 本地持久化收藏夹和推荐历史 |
| 🎨 自定义视觉 | 80+ SVG 食材图标、渐变动效、自定义 TabBar |

---

## 🛠 技术栈

### 前端（微信小程序原生）

```
WXML + WXSS + JavaScript (ES6+)
自定义 Component / 自定义 TabBar
wx.request 网络请求
wx.getStorageSync 本地存储
CSS Variables 设计系统
```

### 后端（Python FastAPI）

```
Python 3.10+
FastAPI + Uvicorn
Pydantic 数据校验
CORS 跨域支持
```

### 数据

```
30 道菜品（涵盖 8 大菜系）
80+ 种食材（6 大分类）
80+ SVG 原创图标
```

---

## 📁 项目结构

```
what-to-cook/
├── miniprogram/                    # 微信小程序前端
│   ├── app.js                      # 全局入口，初始化本地存储和主题
│   ├── app.json                    # 页面路由、窗口、TabBar 配置
│   ├── app.wxss                    # 全局样式与设计系统（CSS 变量）
│   │
│   ├── pages/                      # 7 个页面
│   │   ├── index/                  # 首页：摇杆机 + 配置面板
│   │   ├── result/                 # 结果页：菜品详情 + Top3 备选
│   │   ├── steps/                  # 步骤页：时间线 + 食材清单
│   │   ├── videos/                 # 视频列表页
│   │   ├── video-player/           # 视频播放页
│   │   ├── chat/                   # AI 数字人问答页
│   │   └── profile/                # 个人中心：收藏 / 历史
│   │
│   ├── components/                 # 4 个自定义组件
│   │   ├── food-wheel/             # 摇杆机组件（核心交互）
│   │   ├── step-item/              # 步骤项组件
│   │   ├── video-card/             # 视频卡片组件
│   │   └── chat-bubble/            # 聊天气泡组件
│   │
│   ├── custom-tab-bar/             # 自定义底部导航
│   ├── utils/                      # 工具层
│   │   ├── api.js                  # API 服务层（后端/Mock 双通道）
│   │   ├── shuffle.js              # 摇一摇算法（本地降级版）
│   │   ├── storage.js              # 本地存储封装
│   │   ├── icon-map.js             # 食材 → SVG 图标映射
│   │   └── ai-service.js           # AI 服务接口
│   ├── mock/                       # 本地 Mock 数据
│   │   ├── dishes.js               # 30 道菜品 + 80+ 食材
│   │   ├── videos.js               # 视频数据
│   │   └── ai-replies.js           # AI 回复规则
│   └── images/icons/               # 80+ SVG 食材图标
│
├── backend/                        # FastAPI 后端
│   ├── main.py                     # 应用入口，注册路由 + CORS
│   ├── requirements.txt            # Python 依赖
│   └── app/
│       ├── data/                   # 数据层
│       │   ├── dishes.py           # 菜品与食材数据
│       │   └── videos.py           # 视频数据
│       ├── models/
│       │   └── schemas.py          # Pydantic 数据模型
│       ├── routers/                # API 路由
│       │   ├── dishes.py           # 菜品接口
│       │   ├── videos.py           # 视频接口
│       │   └── chat.py             # AI 问答接口
│       └── services/               # 业务服务
│           ├── shuffle.py          # 随机推荐算法
│           └── ai_chat.py          # AI 问答服务
│
├── project.config.json             # 微信开发者工具配置
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
    │  ├── 目标菜系：家常菜 / 川菜 / 粤菜 / 湘菜 / 东北菜 / 西餐 ...
    │  └── 口味程度：清淡 / 微辣 / 中辣 / 重辣 / 甜口 / 酸口 / 咸鲜
    │
    ▼
点击摇杆 / 按钮
    │
    ▼
food-wheel 组件启动滚轮动画
    │  ├── 每个槽位独立 setInterval 快速切换食材（74ms + i*16ms）
    │  ├── 逐个槽位延迟停止（980ms + i*360ms）
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
    ├── true  →  请求后端 /api/dishes/random
    └── false →  本地 shuffle.js performShuffle()
    │
    ▼
推荐算法执行
    │  1. 按食材类型过滤食材池
    │  2. 随机抽取 N 个不重复食材
    │  3. 按菜系 + 口味双重过滤候选菜品
    │  4. 评分：score = 命中食材数 - 额外食材数 × 0.3
    │  5. 返回 Top 3 匹配菜品
    │
    ▼
写入 globalData.currentDish / matchedDishes
    │
    ▼
跳转结果页
```

**关键代码位置：**
- 摇杆机组件：[miniprogram/components/food-wheel/food-wheel.js](miniprogram/components/food-wheel/food-wheel.js)
- 首页逻辑：[miniprogram/pages/index/index.js](miniprogram/pages/index/index.js)
- 本地算法：[miniprogram/utils/shuffle.js](miniprogram/utils/shuffle.js)
- 后端算法：[backend/app/services/shuffle.py](backend/app/services/shuffle.py)

---

### 2. 做菜流程

```
结果页点击"开始做菜"
    │
    ▼
进入 steps 页面
    │
    ▼
展示食材勾选清单
    │  └── 用户逐一勾选已准备的食材
    │
    ▼
展示时间线式步骤
    │  ├── 当前步骤高亮
    │  ├── 已完成步骤打勾
    │  └── 未完成步骤灰显
    │
    ▼
用户逐步操作
    │  ├── 上一步 / 下一步切换
    │  └── 进度条实时更新
    │
    ▼
完成后写入 dishHistory
    │
    ▼
可跳转：看视频 / 问数字人
```

---

### 3. AI 数字人问答流程

```
用户进入 chat 页面
    │
    ▼
加载本地聊天历史 / 快捷问题
    │
    ▼
用户输入问题（或点击快捷问题）
    │
    ▼
调用 sendChatMessage(message, context)
    │  ├── context 携带最近 6 条对话
    │  └── 支持从结果页带入"XXX怎么做？"的预设问题
    │
    ▼
后端 /api/chat 接收请求
    │
    ▼
AI 服务匹配回复
    │  1. 关键词匹配（粘锅 / 火候 / 嫩肉 / 调味 ...）
    │  2. 菜名匹配 → 返回完整做法步骤
    │  3. 兜底默认回复
    │
    ▼
前端展示打字动画 + 写入本地记录
```

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

所有接口（菜品 / 视频 / 问答 / 菜系 / 口味）均走此模式，保证后端不可用时小程序仍可完整运行。

---

## 📡 后端 API 文档

启动后端后访问 `http://localhost:8001/docs` 可查看交互式文档。

### 菜品接口

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/dishes/categories` | 菜系分类列表 | - |
| GET | `/api/dishes/ingredients` | 所有食材 | - |
| GET | `/api/dishes` | 菜品列表 | `?category=` |
| GET | `/api/dishes/random` | 摇一摇推荐 | `?category=&count=2-4&type=` |
| GET | `/api/dishes/{id}` | 菜品详情 | - |
| GET | `/api/dishes/{id}/steps` | 菜品步骤 | - |

### 视频接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/videos/categories` | 视频分类 |
| GET | `/api/videos` | 视频列表（支持 `?category=`） |
| GET | `/api/videos/{id}` | 视频详情 |

### AI 问答接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | 发送问题，返回回复 |
| GET | `/api/chat/quick-questions` | 快捷问题列表 |

### 示例：摇一摇请求

```http
GET /api/dishes/random?category=川菜&count=3&type=meat
```

```json
{
  "selected_ingredients": [
    { "name": "猪肉", "emoji": "🥩" },
    { "name": "鸡胸肉", "emoji": "🍗" },
    { "name": "排骨", "emoji": "🍖" }
  ],
  "matched_dish": {
    "id": 8,
    "name": "宫保鸡丁",
    "category": "川菜",
    "difficulty": "中等",
    "time": 20,
    "calories": 280,
    "ingredients": ["鸡胸肉", "花生米", "干辣椒", "..."],
    "steps": ["..."]
  },
  "matched_dishes": ["..."]
}
```

---

## 🚀 快速开始

### 环境要求

- 微信开发者工具（最新稳定版）
- Python 3.10+
- Node.js（仅用于语法检查，非必须）

### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

验证：

```bash
curl http://localhost:8001/api/health
# {"status":"ok","service":"今天吃什么"}
```

交互式文档：`http://localhost:8001/docs`

### 2. 启动小程序

1. 打开微信开发者工具
2. 导入项目，选择根目录 `what-to-cook`（**不是** `miniprogram/` 目录）
3. 确认 `project.config.json` 中 `miniprogramRoot` 为 `miniprogram/`
4. 编译运行

### 3. 前后端联调

编辑 [miniprogram/utils/api.js](miniprogram/utils/api.js)：

```javascript
const USE_API = true  // 改为 true 启用后端调用
```

> 真机调试需将 `BASE_URL` 改为局域网可访问地址或 HTTPS 域名，并在小程序后台配置 request 合法域名。

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

---

## 📊 数据概览

### 菜品分布

| 菜系 | 数量 | 代表菜 |
|------|------|--------|
| 家常菜 | 10 | 番茄炒蛋、红烧肉、可乐鸡翅 |
| 川菜 | 5 | 宫保鸡丁、麻婆豆腐、水煮牛肉、回锅肉 |
| 粤菜 | 3 | 清蒸鲈鱼、白切鸡、蚝油生菜 |
| 湘菜 | 3 | 剁椒鱼头、小炒黄牛肉、干锅花菜 |
| 东北菜 | 2 | 地三鲜、锅包肉 |
| 苏菜 | 1 | 东坡肉 |
| 海鲜 | 2 | 蒜蓉粉丝蒸虾、清蒸鲈鱼 |
| 西餐 | 1 | 溏心蛋沙拉 |
| 主食 / 汤煲 | 3 | 蛋炒饭、紫菜蛋花汤 |

### 食材分类

| 类别 | 数量 | 示例 |
|------|------|------|
| 蔬菜 | 26 | 番茄、土豆、西兰花、茄子 |
| 肉禽 | 16 | 猪肉、牛肉、鸡腿、五花肉 |
| 海鲜 | 11 | 虾、鲈鱼、螃蟹、鱿鱼 |
| 蛋豆 | 11 | 鸡蛋、豆腐、腐竹、豌豆 |
| 主食 | 10 | 米饭、面条、年糕、粉丝 |
| 调味 | 39 | 蒜、葱、生抽、豆瓣酱、花椒 |

---

## 🔮 后续工作完善

### 短期（功能补全）

- [ ] **后端口味筛选**：`perform_shuffle` 补齐 `spice_level` 参数，与前端对齐
- [ ] **后端数据同步**：`backend/app/data/dishes.py` 补齐 `cuisine / spiceLevel / type` 字段
- [ ] **清理残留文件**：删除 `index.wxss.bak`
- [ ] **profile 页数据源统一**：改为调用 `getDishDetail()` 而非直接读 mock

### 中期（体验升级）

- [ ] **接入真实大模型**：替换 `ai_chat.py` 中的 `call_ai_api`，接入 DeepSeek / 通义千问 / OpenAI
- [ ] **真实视频地址**：接入视频 CDN，替换当前空 `videoUrl`
- [ ] **菜品图片**：替换 SVG 占位图为真实菜品照片
- [ ] **语音识别接入**：对接腾讯云 ASR，替换当前录音 mock
- [ ] **做菜计时器**：步骤页加入倒计时提醒

### 长期（产品演进）

- [ ] **数据库迁移**：菜品/视频/用户数据迁移到 PostgreSQL 或云开发数据库
- [ ] **用户系统**：微信登录 + 云端收藏/历史同步
- [ ] **智能推荐**：基于用户历史、收藏、季节、时间段的个性化推荐
- [ ] **冰箱食材输入**：拍照识别 / 手动输入已有食材，精准匹配菜品
- [ ] **营养分析**：热量、蛋白质、碳水等营养成分计算
- [ ] **菜谱生成**：基于随机食材组合，AI 生成全新菜谱
- [ ] **社区分享**：用户上传自己的菜谱和成品图

---

## 📝 开发约定

- 前端文件命名：小写中划线（`food-wheel`、`video-player`）
- 后端文件命名：小写下划线（`ai_chat.py`、`shuffle.py`）
- CSS 变量统一通过 `app.wxss` 的 `page` 选择器定义
- 食材图标统一走 `icon-map.js` 的三层匹配机制
- API 层所有方法支持 `withFallback` 双通道降级

---

## 📄 License

MIT License - 仅供学习和个人使用。

---

> 💡 如果这个项目对你有帮助，欢迎 Star ⭐
