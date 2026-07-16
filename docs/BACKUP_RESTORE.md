# 备份与恢复

## PostgreSQL 生产环境

```bash
docker compose exec -T db pg_dump -U whattocook -d whattocook -Fc \
  > "backups/whattocook-$(date +%Y%m%d-%H%M%S).dump"
```

恢复应优先在新数据库中演练：

```bash
docker compose exec db createdb -U whattocook whattocook_restore
cat backups/目标文件.dump | docker compose exec -T db \
  pg_restore -U whattocook -d whattocook_restore --clean --if-exists
```

上传文件卷应同时归档；数据库和上传文件使用相同时间标签。备份保留 7 天，并至少每月执行一次恢复演练。

## 本地 SQLite 开发库

停止本地 API 后复制 `backend/whattocook.db` 即可。SQLite 备份不能替代生产 PostgreSQL 的 `pg_dump`。
