# GDPR Export Table Migration Guide

## 问题
数据库表 `gdpr_export_requests` 不存在，导致 GDPR 导出功能返回 400 错误。

## 解决方案

### 方法 1: 使用 TypeScript 脚本（推荐）

1. **设置数据库连接**
   ```bash
   cd fenghua-backend
   export DATABASE_URL="你的数据库连接字符串"
   # 或者从 .env 文件加载
   source .env
   ```

2. **运行迁移**
   ```bash
   npx ts-node scripts/run-gdpr-migration-ts.ts
   ```

### 方法 2: 直接使用 psql

```bash
cd fenghua-backend
psql "$DATABASE_URL" -f migrations/031-add-gdpr-export-request-table.sql
```

### 方法 3: 在 psql 中手动运行

```bash
# 连接到数据库
psql "$DATABASE_URL"

# 在 psql 中运行
\i migrations/031-add-gdpr-export-request-table.sql
```

### 方法 4: 使用迁移脚本（需要手动输入密码）

```bash
cd fenghua-backend
./scripts/run-gdpr-migration.sh
```

## 验证

运行迁移后，验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'gdpr_export_requests';

-- 检查表结构
\d gdpr_export_requests

-- 检查索引
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'gdpr_export_requests';
```

## 完成后

1. ✅ 迁移运行成功
2. 🔄 重启后端服务（如果正在运行）
3. 🔄 刷新前端页面
4. ✅ 验证错误是否消失

## 注意事项

- 迁移使用 `CREATE TABLE IF NOT EXISTS`，可以安全地多次运行
- 确保数据库连接字符串正确
- 确保有创建表的权限
