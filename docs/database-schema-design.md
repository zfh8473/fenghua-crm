# 数据库表结构设计文档

**日期：** 2025-12-26  
**项目：** fenghua-crm  
**状态：** 设计完成，待实施  
**最后更新：** 2025-12-26

---

## 文档目的

本文档定义 fenghua-crm 定制表的数据库结构设计，包括：
- 产品表（products）
- 互动记录表（product_customer_interactions）
- 文件附件表（file_attachments）
- 与 Twenty CRM 表的关联关系

---

## 1. 产品表（products）

### 1.1 表结构

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  hs_code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  specifications JSONB,
  image_url TEXT,
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  
  -- 外键关联（Twenty CRM）
  workspace_id UUID NOT NULL,
  
  -- 索引
  CONSTRAINT products_status_check CHECK (status IN ('active', 'inactive', 'archived'))
);
```

### 1.2 字段说明

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 主键，自动生成 |
| name | VARCHAR(255) | NOT NULL | 产品名称（必填） |
| hs_code | VARCHAR(50) | NOT NULL | HS编码（必填，同一工作空间内唯一） |
| description | TEXT | NULL | 产品描述（可选） |
| category | VARCHAR(100) | NULL | 产品类别（可选） |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | 状态：active/inactive/archived |
| specifications | JSONB | NULL | 产品规格（JSON格式，可选） |
| image_url | TEXT | NULL | 产品图片URL（可选） |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMP | NULL | 软删除时间 |
| created_by | UUID | NULL | 创建者ID（关联 Twenty CRM users） |
| updated_by | UUID | NULL | 更新者ID（关联 Twenty CRM users） |
| workspace_id | UUID | NOT NULL | 工作空间ID（关联 Twenty CRM workspace） |

### 1.3 索引设计

```sql
-- 主键索引（自动创建）
-- PRIMARY KEY (id)

-- 唯一索引（按工作空间唯一）
CREATE UNIQUE INDEX idx_products_workspace_hs_code ON products(workspace_id, hs_code) WHERE deleted_at IS NULL;

-- 状态索引（用于过滤 active 产品）
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;

-- 类别索引（用于分类查询）
CREATE INDEX idx_products_category ON products(category) WHERE deleted_at IS NULL;

-- 名称搜索索引（用于模糊搜索）
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name));

-- 工作空间索引（用于多租户隔离）
CREATE INDEX idx_products_workspace ON products(workspace_id) WHERE deleted_at IS NULL;

-- 复合索引（用于常见查询：工作空间 + 状态）
CREATE INDEX idx_products_workspace_status ON products(workspace_id, status) WHERE deleted_at IS NULL;
```

### 1.4 业务规则

1. **HS编码唯一性**：同一工作空间内，HS编码必须唯一（通过复合唯一索引 `(workspace_id, hs_code)` 保证）
2. **软删除**：删除产品时，设置 `deleted_at`，不物理删除
3. **状态管理**：
   - `active`：正常使用
   - `inactive`：停用（有关联互动记录时）
   - `archived`：归档
4. **关联检查**：删除前检查是否有关联的互动记录

---

## 2. 互动记录表（product_customer_interactions）

### 2.1 表结构

```sql
CREATE TABLE product_customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联字段（核心）
  product_id UUID NOT NULL,
  customer_id UUID NOT NULL,  -- 关联 Twenty CRM companies 表
  
  -- 互动信息
  interaction_type VARCHAR(50) NOT NULL,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  status VARCHAR(50),
  
  -- 额外信息（JSON格式，灵活扩展）
  additional_info JSONB,
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  
  -- 外键关联
  workspace_id UUID NOT NULL,
  
  -- 外键约束
  CONSTRAINT fk_interactions_product FOREIGN KEY (product_id) 
    REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_interactions_workspace FOREIGN KEY (workspace_id) 
    REFERENCES workspace(id) ON DELETE CASCADE,
  
  -- 检查约束
  CONSTRAINT interactions_type_check CHECK (
    interaction_type IN (
      -- 采购商互动类型
      'initial_contact',           -- 初步接触
      'product_inquiry',            -- 产品询价
      'quotation',                  -- 报价
      'quotation_accepted',         -- 接受报价
      'quotation_rejected',         -- 拒绝报价
      'order_signed',               -- 签署订单
      'order_completed',            -- 完成订单
      -- 供应商互动类型
      'product_inquiry_supplier',   -- 询价产品
      'quotation_received',          -- 接收报价
      'specification_confirmed',     -- 产品规格确认
      'production_progress',         -- 生产进度跟进
      'pre_shipment_inspection',     -- 发货前验收
      'shipped'                      -- 已发货
    )
  )
);
```

### 2.2 字段说明

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 主键，自动生成 |
| product_id | UUID | NOT NULL, FK | 产品ID（关联 products 表） |
| customer_id | UUID | NOT NULL | 客户ID（关联 Twenty CRM companies 表） |
| interaction_type | VARCHAR(50) | NOT NULL | 互动类型（见检查约束） |
| interaction_date | TIMESTAMP | NOT NULL | 互动时间 |
| description | TEXT | NULL | 互动描述（可选） |
| status | VARCHAR(50) | NULL | 状态（如：pending, completed, cancelled） |
| additional_info | JSONB | NULL | 额外信息（JSON格式，灵活扩展） |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMP | NULL | 软删除时间 |
| created_by | UUID | NULL | 创建者ID |
| updated_by | UUID | NULL | 更新者ID |
| workspace_id | UUID | NOT NULL | 工作空间ID |

### 2.3 索引设计

```sql
-- 主键索引（自动创建）
-- PRIMARY KEY (id)

-- 产品关联索引（用于查询某个产品的所有互动）
CREATE INDEX idx_interactions_product ON product_customer_interactions(product_id) 
  WHERE deleted_at IS NULL;

-- 客户关联索引（用于查询某个客户的所有互动）
CREATE INDEX idx_interactions_customer ON product_customer_interactions(customer_id) 
  WHERE deleted_at IS NULL;

-- 复合索引（用于查询产品-客户互动历史）
CREATE INDEX idx_interactions_product_customer ON product_customer_interactions(product_id, customer_id) 
  WHERE deleted_at IS NULL;

-- 时间索引（用于时间线视图）
CREATE INDEX idx_interactions_date ON product_customer_interactions(interaction_date DESC) 
  WHERE deleted_at IS NULL;

-- 类型索引（用于按类型过滤）
CREATE INDEX idx_interactions_type ON product_customer_interactions(interaction_type) 
  WHERE deleted_at IS NULL;

-- 工作空间索引（用于多租户隔离）
CREATE INDEX idx_interactions_workspace ON product_customer_interactions(workspace_id) 
  WHERE deleted_at IS NULL;

-- 复合索引（用于常见查询：产品 + 客户 + 时间）
CREATE INDEX idx_interactions_product_customer_date ON product_customer_interactions(
  product_id, customer_id, interaction_date DESC
) WHERE deleted_at IS NULL;

-- 创建者索引（用于查询某个用户创建的互动）
CREATE INDEX idx_interactions_creator ON product_customer_interactions(created_by) 
  WHERE deleted_at IS NULL;
```

### 2.4 业务规则

1. **必填关联**：产品关联是必填项（FR21）
2. **软删除**：删除互动记录时，设置 `deleted_at`，不物理删除
3. **时间排序**：互动记录按时间倒序排列（最新的在前）
4. **权限过滤**：根据用户角色过滤客户类型（前端专员只看到采购商，后端专员只看到供应商）

---

## 3. 文件附件表（file_attachments）

### 3.1 表结构

```sql
CREATE TABLE file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联字段
  interaction_id UUID,
  product_id UUID,
  
  -- 文件信息
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  mime_type VARCHAR(100),
  
  -- 存储信息
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'aliyun_oss',  -- 'aliyun_oss', 'aws_s3', 'cloudflare_r2'
  storage_key TEXT NOT NULL,  -- 对象存储的 key
  
  -- 文件元数据
  metadata JSONB,
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  
  -- 外键关联
  workspace_id UUID NOT NULL,
  
  -- 外键约束
  CONSTRAINT fk_attachments_interaction FOREIGN KEY (interaction_id) 
    REFERENCES product_customer_interactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_attachments_product FOREIGN KEY (product_id) 
    REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_attachments_workspace FOREIGN KEY (workspace_id) 
    REFERENCES workspace(id) ON DELETE CASCADE,
  
  -- 检查约束（至少关联一个实体）
  CONSTRAINT attachments_reference_check CHECK (
    (interaction_id IS NOT NULL) OR (product_id IS NOT NULL)
  )
);
```

### 3.2 字段说明

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 主键，自动生成 |
| interaction_id | UUID | NULL, FK | 关联的互动记录ID（可选） |
| product_id | UUID | NULL, FK | 关联的产品ID（可选） |
| file_name | VARCHAR(255) | NOT NULL | 文件名 |
| file_url | TEXT | NOT NULL | 文件访问URL |
| file_size | BIGINT | NOT NULL | 文件大小（字节） |
| file_type | VARCHAR(100) | NOT NULL | 文件类型（photo, document, video等） |
| mime_type | VARCHAR(100) | NULL | MIME类型 |
| storage_provider | VARCHAR(50) | NOT NULL | 存储提供商 |
| storage_key | TEXT | NOT NULL | 对象存储的key |
| metadata | JSONB | NULL | 文件元数据（JSON格式） |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |
| deleted_at | TIMESTAMP | NULL | 软删除时间 |
| created_by | UUID | NULL | 创建者ID |
| workspace_id | UUID | NOT NULL | 工作空间ID |

### 3.3 索引设计

```sql
-- 主键索引（自动创建）
-- PRIMARY KEY (id)

-- 互动记录关联索引
CREATE INDEX idx_attachments_interaction ON file_attachments(interaction_id) 
  WHERE deleted_at IS NULL;

-- 产品关联索引
CREATE INDEX idx_attachments_product ON file_attachments(product_id) 
  WHERE deleted_at IS NULL;

-- 文件类型索引（用于按类型过滤）
CREATE INDEX idx_attachments_type ON file_attachments(file_type) 
  WHERE deleted_at IS NULL;

-- 工作空间索引
CREATE INDEX idx_attachments_workspace ON file_attachments(workspace_id) 
  WHERE deleted_at IS NULL;
```

### 3.4 业务规则

1. **关联要求**：文件必须关联到互动记录或产品（至少一个）
2. **文件大小限制**：单文件 < 50MB（应用层验证）
3. **访问控制**：使用签名URL（临时访问链接）
4. **存储策略**：根据用户分布选择存储提供商

---

## 4. 与 Twenty CRM 表的关联

### 4.1 关联关系图

```
┌─────────────────┐
│  workspace      │ (Twenty CRM)
│  - id           │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
┌────────▼────────┐ ┌──────▼────────┐ ┌─────▼──────────┐
│  companies      │ │  users        │ │  products      │
│  (Twenty CRM)   │ │  (Twenty CRM) │ │  (fenghua-crm) │
│  - id           │ │  - id         │ │  - id          │
│  - name         │ │  - email      │ │  - name        │
│  - type         │ │  - ...        │ │  - hs_code     │
│  (buyer/        │ │               │ │  - ...         │
│   supplier)     │ │               │ └─────┬──────────┘
└────────┬────────┘ └───────────────┘       │
         │                                   │
         │                                   │
┌────────▼──────────────────────────────────▼────────┐
│  product_customer_interactions                       │
│  (fenghua-crm)                                       │
│  - id                                                │
│  - product_id → products.id                           │
│  - customer_id → companies.id                        │
│  - created_by → users.id                            │
│  - workspace_id → workspace.id                       │
└────────┬────────────────────────────────────────────┘
         │
         │
┌────────▼────────┐
│  file_attachments│
│  (fenghua-crm)   │
│  - id            │
│  - interaction_id│
│  - product_id    │
└──────────────────┘
```

### 4.2 外键约束说明

**注意：** 由于 `companies` 和 `users` 表在 Twenty CRM 数据库中，我们无法直接创建外键约束。需要在应用层保证数据一致性。

**应用层验证：**
- 创建互动记录时，验证 `customer_id` 存在于 `companies` 表
- 创建产品时，验证 `created_by` 存在于 `users` 表
- 通过 Twenty CRM GraphQL API 验证关联关系

---

## 5. 数据完整性约束

### 5.1 检查约束

```sql
-- 产品状态检查
ALTER TABLE products ADD CONSTRAINT products_status_check 
  CHECK (status IN ('active', 'inactive', 'archived'));

-- 互动类型检查（已在表定义中）
-- CONSTRAINT interactions_type_check

-- 文件附件关联检查（已在表定义中）
-- CONSTRAINT attachments_reference_check
```

### 5.2 触发器（自动更新时间戳）

```sql
-- 产品表更新时间戳触发器
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- 互动记录表更新时间戳触发器
CREATE OR REPLACE FUNCTION update_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_interactions_updated_at
  BEFORE UPDATE ON product_customer_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_interactions_updated_at();

-- 文件附件表更新时间戳触发器
CREATE OR REPLACE FUNCTION update_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attachments_updated_at
  BEFORE UPDATE ON file_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_attachments_updated_at();
```

---

## 6. 性能优化建议

### 6.1 查询优化

1. **使用复合索引**：针对常见查询模式创建复合索引
2. **软删除过滤**：所有查询都过滤 `deleted_at IS NULL`
3. **分页查询**：使用 `LIMIT` 和 `OFFSET` 或游标分页
4. **缓存策略**：使用 Redis 缓存常用查询结果

### 6.2 数据归档

1. **归档策略**：定期归档旧数据（> 1年）
2. **归档表**：创建 `products_archive` 和 `interactions_archive` 表
3. **归档脚本**：定期运行归档脚本

---

## 7. 迁移计划

### 7.1 迁移步骤

1. **创建表结构**：使用 TypeORM migrations
2. **创建索引**：在表创建后创建索引
3. **创建触发器**：创建自动更新时间戳的触发器
4. **数据验证**：验证表结构和约束
5. **性能测试**：测试查询性能

### 7.2 回滚计划

1. **备份数据**：迁移前备份数据库
2. **回滚脚本**：准备回滚脚本（删除表、索引、触发器）
3. **验证回滚**：测试回滚流程

---

## 8. 参考文档

- [架构文档](../_bmad-output/architecture.md)
- [PRD文档](../_bmad-output/prd.md)
- [基础设施决策文档](infrastructure-decisions.md)

---

## 9. 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2025-12-26 | 创建文档，定义表结构 | 开发团队 |

---

**文档状态：** 设计完成，待实施  
**下次审查：** 实施后验证

