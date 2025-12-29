# 数据库表结构设计评审报告

**日期：** 2025-12-26  
**项目：** fenghua-crm  
**评审人：** 开发团队  
**状态：** ✅ 通过评审，有改进建议

---

## 评审摘要

### 总体评估

**表设计质量：** ⭐⭐⭐⭐⭐ (5/5)  
**符合需求：** ⭐⭐⭐⭐⭐ (5/5)  
**索引策略：** ⭐⭐⭐⭐⭐ (5/5)  
**可扩展性：** ⭐⭐⭐⭐⭐ (5/5)

### 主要发现

✅ **优点：**
- 表结构设计完整，覆盖所有业务需求
- 字段定义清晰，符合 PRD 和架构文档要求
- 索引策略合理，覆盖常见查询模式
- 软删除支持完善
- 审计字段完整
- 与 Twenty CRM 表的关联关系明确

⚠️ **改进建议：**
- HS编码唯一性约束需要按工作空间隔离
- 产品类别可以预定义枚举值
- 互动类型可以扩展（未来可能增加新类型）

---

## 详细评审

### 1. 产品表（products）评审

#### 1.1 字段定义评审

**✅ 符合需求：**

| 需求来源 | 字段 | 状态 | 说明 |
|---------|------|------|------|
| FR1, Story 2.1 | name | ✅ | 产品名称（必填） |
| FR1, Story 2.1 | hs_code | ✅ | HS编码（必填，唯一） |
| FR3, Story 2.1 | description | ✅ | 产品描述（可选） |
| FR2, Story 2.1 | category | ✅ | 产品类别（可选） |
| Story 2.1 | status | ✅ | 状态：active/inactive/archived |
| FR3 | specifications | ✅ | 产品规格（JSONB，灵活） |
| Story 2.1 | image_url | ✅ | 产品图片URL（可选） |

**✅ 审计字段完整：**
- `created_at`, `updated_at`, `deleted_at` - 支持软删除和时间追踪
- `created_by`, `updated_by` - 支持创建者和修改者追踪
- `workspace_id` - 支持多租户隔离

**⚠️ 改进建议：**

1. **HS编码唯一性约束**
   - **当前设计：** 全局唯一（`UNIQUE` 约束）
   - **建议：** 按工作空间唯一（同一工作空间内唯一）
   - **理由：** 不同工作空间可能有相同的HS编码
   - **实施：** 使用复合唯一索引 `(workspace_id, hs_code)`

2. **产品类别枚举**
   - **当前设计：** `VARCHAR(100)` 自由输入
   - **建议：** 考虑预定义类别枚举（可选）
   - **理由：** 便于分类统计和搜索
   - **实施：** 可以保持 VARCHAR，在应用层验证

#### 1.2 索引策略评审

**✅ 索引设计合理：**

| 索引 | 用途 | 合理性 | 说明 |
|------|------|--------|------|
| `idx_products_hs_code` | HS编码唯一性 | ✅ | 支持快速查找和唯一性检查 |
| `idx_products_status` | 状态过滤 | ✅ | 支持过滤 active 产品 |
| `idx_products_category` | 类别查询 | ✅ | 支持按类别查询 |
| `idx_products_name_search` | 名称搜索 | ✅ | 支持全文搜索（GIN索引） |
| `idx_products_workspace` | 多租户隔离 | ✅ | 支持工作空间过滤 |
| `idx_products_workspace_status` | 复合查询 | ✅ | 支持常见查询模式 |

**✅ 性能优化：**
- 所有索引都包含 `WHERE deleted_at IS NULL`，只索引未删除记录
- 复合索引覆盖常见查询模式
- 全文搜索索引支持模糊搜索

**⚠️ 改进建议：**

1. **HS编码唯一索引**
   - **当前：** `idx_products_hs_code ON products(hs_code) WHERE deleted_at IS NULL`
   - **建议：** `idx_products_workspace_hs_code ON products(workspace_id, hs_code) WHERE deleted_at IS NULL`
   - **理由：** 支持按工作空间唯一性

---

### 2. 互动记录表（product_customer_interactions）评审

#### 2.1 字段定义评审

**✅ 符合需求：**

| 需求来源 | 字段 | 状态 | 说明 |
|---------|------|------|------|
| FR21 | product_id | ✅ | 产品关联（必填） |
| FR19, FR20 | customer_id | ✅ | 客户关联（必填） |
| FR19, FR20 | interaction_type | ✅ | 互动类型（必填） |
| FR30 | interaction_date | ✅ | 互动时间（必填） |
| FR22 | description | ✅ | 互动描述（可选） |
| FR22 | status | ✅ | 状态（可选） |
| FR22 | additional_info | ✅ | 额外信息（JSONB，灵活扩展） |

**✅ 互动类型覆盖完整：**

**采购商互动类型：**
- ✅ `initial_contact` - 初步接触
- ✅ `product_inquiry` - 产品询价
- ✅ `quotation` - 报价
- ✅ `quotation_accepted` - 接受报价
- ✅ `quotation_rejected` - 拒绝报价
- ✅ `order_signed` - 签署订单
- ✅ `order_completed` - 完成订单

**供应商互动类型：**
- ✅ `product_inquiry_supplier` - 询价产品
- ✅ `quotation_received` - 接收报价
- ✅ `specification_confirmed` - 产品规格确认
- ✅ `production_progress` - 生产进度跟进
- ✅ `pre_shipment_inspection` - 发货前验收
- ✅ `shipped` - 已发货

**✅ 审计字段完整：**
- `created_at`, `updated_at`, `deleted_at` - 支持软删除和时间追踪
- `created_by`, `updated_by` - 支持创建者和修改者追踪（FR31）
- `workspace_id` - 支持多租户隔离

**⚠️ 改进建议：**

1. **互动类型扩展性**
   - **当前设计：** CHECK 约束硬编码所有类型
   - **建议：** 保持 CHECK 约束，但考虑未来扩展机制
   - **理由：** 未来可能增加新的互动类型
   - **实施：** 可以通过 ALTER TABLE 添加新类型

2. **时间字段命名**
   - **当前设计：** `interaction_date`
   - **建议：** 保持 `interaction_date`（符合业务语义）
   - **理由：** 清晰表达这是互动发生的时间

#### 2.2 索引策略评审

**✅ 索引设计合理：**

| 索引 | 用途 | 合理性 | 说明 |
|------|------|--------|------|
| `idx_interactions_product` | 产品关联查询 | ✅ | 支持查询某个产品的所有互动 |
| `idx_interactions_customer` | 客户关联查询 | ✅ | 支持查询某个客户的所有互动 |
| `idx_interactions_product_customer` | 产品-客户查询 | ✅ | 支持查询产品-客户互动历史 |
| `idx_interactions_date` | 时间线视图 | ✅ | 支持按时间排序（倒序） |
| `idx_interactions_type` | 类型过滤 | ✅ | 支持按互动类型过滤 |
| `idx_interactions_workspace` | 多租户隔离 | ✅ | 支持工作空间过滤 |
| `idx_interactions_product_customer_date` | 复合查询 | ✅ | 支持常见查询模式（产品+客户+时间） |
| `idx_interactions_creator` | 创建者查询 | ✅ | 支持查询某个用户创建的互动 |

**✅ 性能优化：**
- 复合索引覆盖常见查询模式（产品+客户+时间）
- 时间索引使用 DESC，支持时间线视图（最新的在前）
- 所有索引都包含 `WHERE deleted_at IS NULL`

**✅ 符合业务需求：**
- 支持 FR5：产品与客户的完整互动历史
- 支持 FR16：客户针对某个产品的完整互动历史
- 支持 FR26：客户的所有互动记录（按时间顺序）

---

### 3. 文件附件表（file_attachments）评审

#### 3.1 字段定义评审

**✅ 符合需求：**

| 需求来源 | 字段 | 状态 | 说明 |
|---------|------|------|------|
| FR23, FR24, FR25 | interaction_id | ✅ | 关联互动记录（可选） |
| FR23 | product_id | ✅ | 关联产品（可选） |
| FR23, FR24, FR25 | file_name | ✅ | 文件名 |
| FR23, FR24, FR25 | file_url | ✅ | 文件访问URL |
| FR23, FR24, FR25 | file_size | ✅ | 文件大小 |
| FR23, FR24, FR25 | file_type | ✅ | 文件类型（photo, document, video） |
| - | storage_provider | ✅ | 存储提供商 |
| - | storage_key | ✅ | 对象存储key |

**✅ 设计合理：**
- 支持关联到互动记录或产品（至少一个）
- 支持多种存储提供商（阿里云OSS、AWS S3、Cloudflare R2）
- 文件元数据使用 JSONB，灵活扩展

**✅ 符合基础设施决策：**
- 使用云对象存储（符合基础设施决策文档）
- 数据库只存储文件URL和元数据（符合最佳实践）

#### 3.2 索引策略评审

**✅ 索引设计合理：**
- 互动记录关联索引 - 支持查询某个互动的所有附件
- 产品关联索引 - 支持查询某个产品的所有附件
- 文件类型索引 - 支持按类型过滤（照片、文档、视频）
- 工作空间索引 - 支持多租户隔离

---

### 4. 与 Twenty CRM 表的关联评审

#### 4.1 关联关系评审

**✅ 关联关系清晰：**

1. **products 表：**
   - `workspace_id` → Twenty CRM `workspace.id` ✅
   - `created_by` → Twenty CRM `users.id` ✅
   - `updated_by` → Twenty CRM `users.id` ✅

2. **product_customer_interactions 表：**
   - `product_id` → `products.id` ✅（外键约束）
   - `customer_id` → Twenty CRM `companies.id` ⚠️（无法创建外键，应用层验证）
   - `workspace_id` → Twenty CRM `workspace.id` ⚠️（无法创建外键，应用层验证）
   - `created_by` → Twenty CRM `users.id` ⚠️（无法创建外键，应用层验证）

3. **file_attachments 表：**
   - `interaction_id` → `product_customer_interactions.id` ✅（外键约束）
   - `product_id` → `products.id` ✅（外键约束）
   - `workspace_id` → Twenty CRM `workspace.id` ⚠️（无法创建外键，应用层验证）

**⚠️ 注意事项：**
- 由于 `companies` 和 `users` 表在 Twenty CRM 数据库中，无法创建外键约束
- 需要在应用层验证数据一致性
- 通过 Twenty CRM GraphQL API 验证关联关系

**✅ 应用层验证策略：**
- 创建互动记录时，验证 `customer_id` 存在于 `companies` 表
- 创建产品时，验证 `created_by` 存在于 `users` 表
- 通过 Twenty CRM GraphQL API 验证关联关系

---

### 5. 数据完整性约束评审

#### 5.1 检查约束评审

**✅ 约束设计合理：**

1. **产品状态约束：**
   ```sql
   CONSTRAINT products_status_check CHECK (status IN ('active', 'inactive', 'archived'))
   ```
   - ✅ 符合业务需求（Story 2.1）
   - ✅ 支持软删除策略

2. **互动类型约束：**
   ```sql
   CONSTRAINT interactions_type_check CHECK (interaction_type IN (...))
   ```
   - ✅ 覆盖所有业务需求（FR19, FR20）
   - ✅ 包含采购商和供应商的所有互动类型

3. **文件附件关联约束：**
   ```sql
   CONSTRAINT attachments_reference_check CHECK (
     (interaction_id IS NOT NULL) OR (product_id IS NOT NULL)
   )
   ```
   - ✅ 确保文件至少关联一个实体
   - ✅ 符合业务需求

#### 5.2 触发器评审

**✅ 触发器设计合理：**
- 自动更新 `updated_at` 时间戳
- 使用 PostgreSQL 函数，性能好
- 覆盖所有需要自动更新的表

---

### 6. 性能优化评审

#### 6.1 索引优化

**✅ 索引策略优秀：**
- 所有索引都包含 `WHERE deleted_at IS NULL`，减少索引大小
- 复合索引覆盖常见查询模式
- 全文搜索索引支持模糊搜索

**✅ 查询优化：**
- 支持按工作空间过滤（多租户隔离）
- 支持按状态过滤（active/inactive）
- 支持按时间排序（时间线视图）
- 支持按类型过滤（互动类型、文件类型）

#### 6.2 软删除优化

**✅ 软删除设计合理：**
- 所有表都支持软删除（`deleted_at` 字段）
- 所有查询都过滤 `deleted_at IS NULL`
- 所有索引都包含 `WHERE deleted_at IS NULL`

---

## 改进建议总结

### 必须修复（高优先级）

1. **HS编码唯一性约束**
   - **问题：** 当前是全局唯一，应该是按工作空间唯一
   - **修复：** 修改唯一索引为复合索引 `(workspace_id, hs_code)`
   - **影响：** 高（影响数据完整性）

### 应该改进（中优先级）

2. **产品类别枚举（可选）**
   - **问题：** 当前是自由输入，可以考虑预定义类别
   - **建议：** 保持 VARCHAR，在应用层验证或提供类别列表
   - **影响：** 中（影响数据一致性）

3. **互动类型扩展机制**
   - **问题：** CHECK 约束硬编码所有类型
   - **建议：** 文档化扩展流程（如何添加新类型）
   - **影响：** 低（未来扩展时需要考虑）

---

## 评审结论

### 总体评价

**✅ 表设计通过评审**

表结构设计完整、合理，符合所有业务需求（PRD、Epic、Story）。索引策略优秀，性能优化到位。只需要修复 HS编码唯一性约束问题即可。

### 建议行动

1. **立即修复：**
   - 修改 HS编码唯一索引为复合索引 `(workspace_id, hs_code)`

2. **可选改进：**
   - 考虑产品类别预定义枚举（应用层实现）
   - 文档化互动类型扩展流程

3. **实施准备：**
   - 表设计已就绪，可以开始创建迁移脚本
   - 迁移脚本已创建，可以开始测试

---

## 评审记录

| 日期 | 评审人 | 结果 | 备注 |
|------|--------|------|------|
| 2025-12-26 | 开发团队 | ✅ 通过 | 需要修复 HS编码唯一性约束 |

---

**评审状态：** ✅ 通过评审  
**下次审查：** 实施后验证

