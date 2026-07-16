# 云服务器部署说明

## 前置条件

- Linux 云服务器、Docker Engine、Docker Compose v2。
- 已解析的域名和 HTTPS 证书；微信小程序后台已登记同一 API 域名。
- 仓库根目录 `.env` 已从 `.env.example` 创建，且没有提交到 Git。后端、管理后台和 Compose 共用此配置入口。

## 必填生产配置

```dotenv
APP_ENV=production
DEMO_MODE=false
JWT_SECRET=至少32字符的随机值
WX_APPID=真实AppID
WX_SECRET=真实Secret
CORS_ORIGINS=https://你的管理台域名
ADMIN_USERNAME=首次管理员
ADMIN_PASSWORD=至少10字符的强密码
AI_PROVIDER=openai_compatible
AI_API_BASE=https://供应商的完整chat/completions地址
AI_API_KEY=服务端密钥
AI_MODEL=模型名
DATABASE_URL=postgresql+psycopg://whattocook:密码@db:5432/whattocook
STORAGE_BACKEND=s3
S3_ENDPOINT=https://对象存储API地址
S3_BUCKET=存储桶
S3_ACCESS_KEY=访问密钥
S3_SECRET_KEY=私密密钥
S3_PUBLIC_BASE_URL=https://静态资源CDN域名
```

在仓库根目录额外设置 Compose 使用的 `POSTGRES_PASSWORD`。密码应使用 URL 安全字符，或在 `DATABASE_URL` 中进行 URL 编码。

## 启动

```bash
docker compose build
docker compose up -d
curl http://127.0.0.1:8080/api/health/live
curl http://127.0.0.1:8080/api/health/ready
```

API 容器启动时会依次执行 `alembic upgrade head`、空库 seed 和 Uvicorn。已有数据不会被 seed 重复写入。

本地开发与生产端口不同：本地管理台固定为 `127.0.0.1:5175`、API 为 `127.0.0.1:8002`；Compose 生产入口仍为 `127.0.0.1:8080`。生产环境的 `CORS_ORIGINS` 应填写实际 HTTPS 管理台域名，不应填写本地端口。

生产配置会拒绝本地文件存储。头像和管理台上传的 MP4 会写入 S3 兼容对象存储；存储桶或 CDN 必须允许小程序通过 HTTPS 读取这些对象。

外层云负载均衡或宿主机 Nginx 应终止 HTTPS，再转发到 `127.0.0.1:8080`。不要直接向公网开放 API 容器端口。

## 更新与回滚

1. 更新前备份数据库和上传卷。
2. 记录当前 Git commit 和镜像 ID。
3. 构建新镜像并运行健康检查。
4. 异常时恢复旧 commit/镜像；数据结构变更只能通过向后兼容迁移回滚。

现有 SQLite 数据迁移到已执行 Alembic 的空 PostgreSQL 数据库：

```bash
cd backend
DATABASE_URL='postgresql+psycopg://...' python migrate_sqlite_to_postgres.py ./whattocook.db
```
