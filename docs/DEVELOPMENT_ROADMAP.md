# 「今天吃什么」MVP 完善与发布路线

更新时间：2026-07-16

## 当前状态

项目具备微信小程序、FastAPI API、SQLite 数据、AI/TTS、用户数据和 Vue 管理台。第一轮上线加固已经完成：

- 认证默认不再降级为 Mock Token，生产环境禁止 `DEMO_MODE`。
- 菜品辣度接口、用户批量同步、统一错误、请求 ID、限流、live/ready 健康检查已加入。
- AI 支持 Ollama、OpenAI-compatible API 和显式规则模式；生产上游失败不会伪装为 AI 成功。
- 管理后台停止生成重复 JS，CI、Docker 和 Nginx 基础部署已加入。
- 数据连接已切换为 `DATABASE_URL + SQLAlchemy`，PostgreSQL schema、Alembic、seed、SQLite 数据搬迁脚本和 PostgreSQL CI 任务已加入。
- 头像与自有 MP4 已接入 local/S3 存储抽象，生产环境强制 S3；管理台支持直接上传 MP4 并写回视频地址。
- 管理台删除菜品前会读取关联影响，展示将级联删除的食材关联、步骤、视频、收藏和历史数量。

## 本地开发端口约定

| 服务 | 地址 | 说明 |
| --- | --- | --- |
| 管理后台 | `http://127.0.0.1:5175/` | Vite 开发端口固定为 5175 |
| FastAPI | `http://127.0.0.1:8002/` | 小程序与管理后台共用 API |
| Swagger | `http://127.0.0.1:8002/docs` | 本地接口调试 |

后端 `CORS_ORIGINS` 默认只放行管理后台的 `localhost:5175` 与 `127.0.0.1:5175`。变更管理台端口时必须同步修改 CORS 并重启后端。后端未配置固定 `JWT_SECRET` 时，每次重启都会使旧 Token 失效，浏览器需要重新登录。

本地环境变量统一维护在仓库根目录 `.env`，模板为 `.env.example`。FastAPI、Vite 管理后台和 Docker Compose 共用该入口，不再分别维护子目录示例配置。

## 发布门禁

以下事项完成前不得宣称 PostgreSQL 生产环境已经验收：

1. GitHub Actions 的 PostgreSQL 任务首次运行并通过。
2. 在目标云服务器执行 SQLite 数据搬迁、数量校验和回滚演练。
3. 对真实生产数据抽查中文、时间字段、外键与自增序列。

当前 Compose 已使用 PostgreSQL 17；本机因未安装 Docker，尚未完成容器实例级验证。

## 后续里程碑

### M1：真实环境接入

- 配置微信 AppID/Secret、HTTPS 合法域名、稳定 JWT 密钥。
- 选择云模型并填写 `AI_PROVIDER=openai_compatible`、完整 Chat Completions 地址、Key 和模型名。
- 将头像与自有视频接入 S3 兼容对象存储；在此之前生产头像使用持久化上传卷。

### M2：数据库迁移（代码完成，待环境验收）

- 使用 SQLAlchemy 连接边界和 Alembic 初始版本管理 PostgreSQL schema。
- 保持现有成功响应与接口路径兼容。
- seed 后必须得到 100 道菜、160 种食材、473 个步骤及对应视频。
- 执行 `python migrate_sqlite_to_postgres.py <旧数据库>` 前备份；执行后校验数量、唯一约束、外键和中文抽样。

### M3：体验与内容

- 清理生产内容中的占位视频；第三方视频只保留来源、作者和外链。
- 真机检查安全区、键盘、长文本、弱网、流式中断和音频播放。
- 完善管理台菜品食材关联与删除影响预览。

### M4：灰度发布

- 10–20 名用户使用 3–7 天；记录阻断错误、同步冲突、AI 失败和接口耗时。
- P0/P1 清零，完成数据库与上传文件恢复演练，再提交微信审核。

## 验证命令

```powershell
python -m compileall -q backend
python -m pytest backend/tests -q
node tests/miniprogram-smoke.js
Get-ChildItem miniprogram -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
Set-Location admin-web; npm ci; npm run build
```

每个里程碑只有在自动化检查、手工场景和文档均完成后才能关闭。
