# 数据库迁移测试指南

**日期：** 2025-12-26  
**项目：** fenghua-crm

---

## 概述

本文档提供测试数据库迁移脚本的详细指南，包括验证表结构、索引、触发器和函数。

---

## 测试环境准备

### 1. 数据库连接

确保 PostgreSQL 数据库已启动并可以连接：

```bash
# 检查 PostgreSQL 是否运行
psql --version

# 测试连接
psql -h localhost -U postgres -d postgres -c "SELECT version();"
```

### 2. 创建测试数据库

```bash
# 创建测试数据库
psql -h localhost -U postgres -c "CREATE DATABASE fenghua_crm_test;"

# 或使用现有数据库
# 确保数据库为空或可以安全删除
```

---

## 测试步骤

### 步骤 1: 运行迁移脚本

```bash
cd fenghua-backend
./scripts/run-migrations.sh
```

**输入参数：**
- Database host: `localhost` (默认)
- Database port: `5432` (默认)
- Database name: `fenghua_crm` (默认)
- Database user: `postgres` (默认)
- Database password: (输入密码)

**预期输出：**
```
✓ Database connection successful
✓ 001-create-products-table.sql completed successfully
✓ 002-create-interactions-table.sql completed successfully
✓ 003-create-attachments-table.sql completed successfully
```

---

### 步骤 2: 验证迁移结果

运行验证脚本：

```bash
cd fenghua-backend
./scripts/verify-migrations.sh
```

**预期输出：**
```
✓ Table 'products' exists
✓ Table 'product_customer_interactions' exists
✓ Table 'file_attachments' exists
✓ Index 'idx_products_workspace_hs_code' exists
... (所有索引)
✓ Trigger 'trigger_update_products_updated_at' exists
... (所有触发器)
✓ Function 'update_products_updated_at' exists
... (所有函数)
✓ All migrations verified successfully!
```

---

### 步骤 3: 手动验证（可选）

#### 3.1 检查表结构

```sql
-- 连接到数据库
psql -h localhost -U postgres -d fenghua_crm

-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('products', 'product_customer_interactions', 'file_attachments');

-- 检查表结构
\d products
\d product_customer_interactions
\d file_attachments
```

#### 3.2 检查索引

```sql
-- 检查所有索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('products', 'product_customer_interactions', 'file_attachments')
ORDER BY tablename, indexname;
```

#### 3.3 检查触发器

```sql
-- 检查触发器
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('products', 'product_customer_interactions', 'file_attachments');
```

#### 3.4 检查函数

```sql
-- 检查函数
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN (
  'update_products_updated_at',
  'update_interactions_updated_at',
  'update_attachments_updated_at'
);
```

---

### 步骤 4: 测试触发器功能

#### 4.1 测试 products 表触发器

```sql
-- 插入测试数据
INSERT INTO products (name, hs_code, workspace_id)
VALUES ('Test Product', '1234.56.78', 'workspace-123');

-- 检查 created_at 和 updated_at
SELECT name, created_at, updated_at FROM products WHERE name = 'Test Product';

-- 更新数据
UPDATE products SET name = 'Updated Product' WHERE name = 'Test Product';

-- 检查 updated_at 是否自动更新
SELECT name, created_at, updated_at FROM products WHERE name = 'Updated Product';
-- updated_at 应该比 created_at 新
```

#### 4.2 测试 interactions 表触发器

```sql
-- 插入测试数据
INSERT INTO product_customer_interactions (
  product_id, customer_id, interaction_type, interaction_date, workspace_id
)
VALUES (
  (SELECT id FROM products LIMIT 1),
  'customer-123',
  'product_inquiry',
  NOW(),
  'workspace-123'
);

-- 更新数据
UPDATE product_customer_interactions 
SET description = 'Updated description'
WHERE customer_id = 'customer-123';

-- 检查 updated_at 是否自动更新
SELECT interaction_type, created_at, updated_at 
FROM product_customer_interactions 
WHERE customer_id = 'customer-123';
```

---

### 步骤 5: 测试约束

#### 5.1 测试 HS编码唯一性约束

```sql
-- 尝试插入重复的 HS编码（同一工作空间）
INSERT INTO products (name, hs_code, workspace_id)
VALUES ('Product 1', '1234.56.78', 'workspace-123');

-- 应该成功

-- 尝试插入相同的 HS编码（同一工作空间）
INSERT INTO products (name, hs_code, workspace_id)
VALUES ('Product 2', '1234.56.78', 'workspace-123');

-- 应该失败：duplicate key value violates unique constraint

-- 尝试插入相同的 HS编码（不同工作空间）
INSERT INTO products (name, hs_code, workspace_id)
VALUES ('Product 3', '1234.56.78', 'workspace-456');

-- 应该成功（不同工作空间可以有不同的 HS编码）
```

#### 5.2 测试互动类型约束

```sql
-- 尝试插入无效的互动类型
INSERT INTO product_customer_interactions (
  product_id, customer_id, interaction_type, interaction_date, workspace_id
)
VALUES (
  (SELECT id FROM products LIMIT 1),
  'customer-123',
  'invalid_type',  -- 无效类型
  NOW(),
  'workspace-123'
);

-- 应该失败：violates check constraint "interactions_type_check"
```

#### 5.3 测试文件附件关联约束

```sql
-- 尝试插入没有关联的文件
INSERT INTO file_attachments (
  file_name, file_url, file_size, file_type, storage_provider, storage_key, workspace_id
)
VALUES (
  'test.jpg',
  'https://example.com/test.jpg',
  1024,
  'photo',
  'aliyun_oss',
  'test-key',
  'workspace-123'
);

-- 应该失败：violates check constraint "attachments_reference_check"
```

---

## 回滚测试（可选）

如果需要测试回滚：

```sql
-- 运行回滚脚本（见 migrations/README.md）
-- 删除触发器
DROP TRIGGER IF EXISTS trigger_update_attachments_updated_at ON file_attachments;
DROP TRIGGER IF EXISTS trigger_update_interactions_updated_at ON product_customer_interactions;
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;

-- 删除函数
DROP FUNCTION IF EXISTS update_attachments_updated_at();
DROP FUNCTION IF EXISTS update_interactions_updated_at();
DROP FUNCTION IF EXISTS update_products_updated_at();

-- 删除表（注意：会删除所有数据）
DROP TABLE IF EXISTS file_attachments;
DROP TABLE IF EXISTS product_customer_interactions;
DROP TABLE IF EXISTS products;
```

---

## 常见问题

### 问题 1: 连接失败

**错误：** `Error: Cannot connect to database`

**解决方案：**
1. 检查 PostgreSQL 是否运行：`pg_isready`
2. 检查连接参数（host, port, user, password）
3. 检查防火墙设置
4. 检查 PostgreSQL 配置文件（`pg_hba.conf`）

---

### 问题 2: 权限不足

**错误：** `permission denied for schema public`

**解决方案：**
```sql
-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE fenghua_crm TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
```

---

### 问题 3: 表已存在

**错误：** `relation "products" already exists`

**解决方案：**
1. 删除现有表（如果测试环境）：
   ```sql
   DROP TABLE IF EXISTS file_attachments CASCADE;
   DROP TABLE IF EXISTS product_customer_interactions CASCADE;
   DROP TABLE IF EXISTS products CASCADE;
   ```
2. 或使用 `IF NOT EXISTS` 子句（迁移脚本已包含）

---

## 测试检查清单

- [ ] 数据库连接成功
- [ ] 所有迁移脚本执行成功
- [ ] 所有表创建成功
- [ ] 所有索引创建成功
- [ ] 所有触发器创建成功
- [ ] 所有函数创建成功
- [ ] HS编码唯一性约束工作正常
- [ ] 互动类型约束工作正常
- [ ] 文件附件关联约束工作正常
- [ ] 触发器自动更新时间戳工作正常
- [ ] 软删除功能正常（deleted_at 字段）

---

## 参考文档

- [迁移脚本 README](../fenghua-backend/migrations/README.md)
- [表结构设计文档](database-schema-design.md)
- [表设计评审报告](database-schema-review.md)

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2025-12-26 | 创建测试指南 | 开发团队 |

---

**文档状态：** 完成  
**下次审查：** 实施后验证

