# 数据库迁移脚本

**项目：** fenghua-crm  
**日期：** 2025-12-26

---

## 迁移脚本说明

本目录包含 fenghua-crm 定制表的数据库迁移脚本。这些脚本使用原生 SQL，不依赖特定的 ORM。

---

## 迁移脚本列表

### 001-create-products-table.sql

创建产品表（products）。

**表结构：**
- 产品基本信息（name, hs_code, description, category, status）
- 产品规格（specifications, JSONB格式）
- 审计字段（created_at, updated_at, deleted_at, created_by, updated_by）
- 工作空间关联（workspace_id）

**索引：**
- HS编码唯一索引
- 状态索引
- 类别索引
- 名称全文搜索索引
- 工作空间索引
- 复合索引（工作空间 + 状态）

**触发器：**
- 自动更新 `updated_at` 时间戳

---

### 002-create-interactions-table.sql

创建互动记录表（product_customer_interactions）。

**表结构：**
- 关联字段（product_id, customer_id）
- 互动信息（interaction_type, interaction_date, description, status）
- 额外信息（additional_info, JSONB格式）
- 审计字段

**索引：**
- 产品关联索引
- 客户关联索引
- 复合索引（产品 + 客户）
- 时间索引（倒序）
- 类型索引
- 工作空间索引
- 复合索引（产品 + 客户 + 时间）
- 创建者索引

**触发器：**
- 自动更新 `updated_at` 时间戳

**注意：** `customer_id` 关联到 Twenty CRM 的 `companies` 表，无法创建外键约束。需要在应用层验证。

---

### 003-create-attachments-table.sql

创建文件附件表（file_attachments）。

**表结构：**
- 关联字段（interaction_id, product_id）
- 文件信息（file_name, file_url, file_size, file_type, mime_type）
- 存储信息（storage_provider, storage_key）
- 文件元数据（metadata, JSONB格式）
- 审计字段

**索引：**
- 互动记录关联索引
- 产品关联索引
- 文件类型索引
- 工作空间索引

**触发器：**
- 自动更新 `updated_at` 时间戳

**约束：** 文件必须关联到互动记录或产品（至少一个）。

---

## 使用方法

### 开发环境

```bash
# 连接到 PostgreSQL 数据库
psql -h localhost -U postgres -d fenghua_crm

# 运行迁移脚本（按顺序）
\i migrations/001-create-products-table.sql
\i migrations/002-create-interactions-table.sql
\i migrations/003-create-attachments-table.sql
```

### 使用脚本运行

```bash
# 运行所有迁移
./scripts/run-migrations.sh

# 或使用 psql
psql -h localhost -U postgres -d fenghua_crm -f migrations/001-create-products-table.sql
psql -h localhost -U postgres -d fenghua_crm -f migrations/002-create-interactions-table.sql
psql -h localhost -U postgres -d fenghua_crm -f migrations/003-create-attachments-table.sql
```

---

## 回滚脚本

如果需要回滚，可以运行以下 SQL：

```sql
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

## 验证

运行迁移后，验证表结构：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('products', 'product_customer_interactions', 'file_attachments');

-- 检查索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('products', 'product_customer_interactions', 'file_attachments');

-- 检查触发器
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('products', 'product_customer_interactions', 'file_attachments');
```

---

## 注意事项

1. **外键约束**：`customer_id` 关联到 Twenty CRM 的 `companies` 表，无法创建外键约束。需要在应用层验证数据一致性。

2. **工作空间ID**：`workspace_id` 需要从 Twenty CRM 获取。确保在插入数据前获取正确的 workspace_id。

3. **软删除**：所有表都支持软删除（`deleted_at` 字段）。查询时应该过滤 `deleted_at IS NULL`。

4. **时间戳**：`created_at` 和 `updated_at` 由数据库自动管理。`updated_at` 通过触发器自动更新。

5. **索引性能**：所有索引都包含 `WHERE deleted_at IS NULL` 条件，只索引未删除的记录，提高查询性能。

---

## 参考文档

- [数据库表结构设计](../../docs/database-schema-design.md)
- [基础设施决策文档](../../docs/infrastructure-decisions.md)
- [基础设施时间表](../../docs/infrastructure-timeline.md)

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2025-12-26 | 创建迁移脚本 | 开发团队 |

