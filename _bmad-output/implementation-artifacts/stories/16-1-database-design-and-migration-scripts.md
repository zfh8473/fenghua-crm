# Story 16.1: 数据库设计和迁移脚本

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **开发团队**,
I want **设计新数据库 Schema 并创建迁移脚本**,
So that **系统可以存储用户、角色、客户和联系人数据，无需依赖 Twenty CRM 数据库**.

## Acceptance Criteria

1. **Given** 需要替代 Twenty CRM 的数据模型
   **When** 开发团队设计新数据库 Schema
   **Then** 创建 `users` 表（用户信息、密码哈希、邮箱验证等）
   **And** 创建 `roles` 表（角色定义）
   **And** 创建 `user_roles` 表（用户角色关联，多对多）
   **And** 创建 `companies` 表（客户信息，支持供应商/采购商类型）
   **And** 创建 `people` 表（联系人信息，关联到客户）
   **And** 所有表包含必要的索引（性能优化）
   **And** 所有表包含审计字段（created_at, updated_at, deleted_at, created_by, updated_by）

2. **Given** 新数据库 Schema 已设计
   **When** 开发团队创建数据库迁移脚本
   **Then** 创建 `004-create-users-and-roles-tables.sql` 迁移脚本
   **And** 创建 `005-create-companies-and-people-tables.sql` 迁移脚本
   **And** 创建 `006-remove-workspace-dependencies.sql` 迁移脚本（更新现有表）
   **And** 所有迁移脚本可以成功执行
   **And** 所有迁移脚本支持回滚（如果可能）

3. **Given** 需要从 Twenty CRM 数据库迁移数据
   **When** 开发团队创建数据迁移脚本
   **Then** 创建 `migrate-from-twenty.ts` 脚本
   **And** 脚本可以导出用户数据（从 `core.user` 表）
   **And** 脚本可以导出角色数据（从 `core.role` 表）
   **And** 脚本可以导出客户数据（从 `core.company` 表）
   **And** 脚本可以导出联系人数据（从 `core.person` 表）
   **And** 脚本可以转换数据格式并导入到新表
   **And** 脚本验证数据完整性（外键关联、数据一致性）

## Tasks / Subtasks

- [x] Task 1: 设计用户和认证表 Schema (AC: #1)
  - [x] 设计 `users` 表结构（id, email, password_hash, first_name, last_name, email_verified, 等）
  - [x] 设计 `roles` 表结构（id, name, description, 等）
  - [x] 设计 `user_roles` 表结构（user_id, role_id, assigned_at, assigned_by）
  - [x] 设计所有必要的索引（email 唯一索引、角色名称唯一索引等）
  - [x] 设计审计字段（created_at, updated_at, deleted_at）

- [x] Task 2: 设计客户和联系人表 Schema (AC: #1)
  - [x] 设计 `companies` 表结构（id, name, domain_name, address, customer_type, 等）
  - [x] 设计 `people` 表结构（id, first_name, last_name, email, company_id, 等）
  - [x] 设计所有必要的索引（客户名称索引、客户类型索引、联系人邮箱索引等）
  - [x] 设计外键关联（people.company_id → companies.id）
  - [x] 设计审计字段

- [x] Task 3: 创建用户和角色表迁移脚本 (AC: #2)
  - [x] 创建 `fenghua-backend/migrations/005-create-users-and-roles-tables.sql`
  - [x] 包含 `users` 表创建语句
  - [x] 包含 `roles` 表创建语句
  - [x] 包含 `user_roles` 表创建语句
  - [x] 包含所有索引创建语句
  - [x] 包含触发器（自动更新 updated_at）
  - [ ] 验证脚本可以成功执行

- [x] Task 4: 创建客户和联系人表迁移脚本 (AC: #2)
  - [x] 创建 `fenghua-backend/migrations/006-create-companies-and-people-tables.sql`
  - [x] 包含 `companies` 表创建语句
  - [x] 包含 `people` 表创建语句
  - [x] 包含所有索引创建语句
  - [x] 包含外键约束
  - [x] 包含触发器
  - [ ] 验证脚本可以成功执行

- [x] Task 5: 创建移除 workspace 依赖的迁移脚本 (AC: #2)
  - [x] 创建 `fenghua-backend/migrations/007-remove-workspace-dependencies.sql`
  - [x] 更新 `products` 表：移除 `workspace_id`，添加 `created_by`/`updated_by`
  - [x] 更新 `product_customer_interactions` 表：移除 `workspace_id`，更新 `customer_id` 外键
  - [x] 更新 `file_attachments` 表：移除 `workspace_id`
  - [ ] 验证脚本可以成功执行

- [x] Task 5.1: 创建角色种子数据脚本 (AC: #2)
  - [x] 创建 `fenghua-backend/migrations/008-seed-roles.sql`
  - [x] 插入默认角色（ADMIN, DIRECTOR, FRONTEND_SPECIALIST, BACKEND_SPECIALIST）
  - [x] 使用 `ON CONFLICT DO NOTHING` 避免重复插入

- [x] Task 6: 创建数据迁移脚本 (AC: #3)
  - [x] 创建 `fenghua-backend/scripts/migrate-from-twenty.ts`
  - [x] 实现从 Twenty CRM 数据库导出用户数据的功能
  - [x] 实现从 Twenty CRM 数据库导出角色数据的功能
  - [x] 实现从 Twenty CRM 数据库导出用户角色映射的功能
  - [x] 实现从 Twenty CRM 数据库导出客户数据的功能
  - [x] 实现从 Twenty CRM 数据库导出联系人数据的功能
  - [x] 实现数据格式转换（Twenty 格式 → 新格式）
  - [x] 实现数据导入到新表的功能
  - [x] 实现数据完整性验证（外键关联、数据一致性）
  - [x] 添加错误处理和日志记录

- [x] Task 7: 测试迁移脚本 (AC: #2, #3)
  - [x] 创建测试脚本 `test-migrations-16-1.sh`
  - [x] 创建测试报告模板 `migration-test-story-16-1-2025-12-26.md`
  - [x] 在开发环境测试所有迁移脚本
  - [x] 验证表结构正确创建（5 个表全部创建成功）
  - [x] 验证索引正确创建（22 个索引全部创建成功）
  - [x] 验证外键约束正确（8 个外键约束全部创建成功）
  - [x] 验证触发器正确（4 个触发器全部创建成功）
  - [x] 验证角色种子数据（4 个角色全部插入成功）
  - [x] 修复 CRITICAL 问题（用户导入缺少 password_hash）
  - [ ] 测试数据迁移脚本（如果有测试数据，可选）

## Dev Notes

- **参考文档：**
  - 重构计划：`_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`（阶段 1）
  - 数据库 Schema 设计：重构计划中的详细 SQL 语句

- **数据库连接：**
  - 开发环境：Neon PostgreSQL（`DATABASE_URL`）
  - Twenty CRM 数据库：Docker PostgreSQL（`TWENTY_DATABASE_URL`，用于数据迁移）

- **迁移脚本位置：**
  - 数据库迁移：`fenghua-backend/migrations/`
  - 数据迁移脚本：`fenghua-backend/scripts/migrate-from-twenty.ts`

- **关键设计决策：**
  - 使用 UUID 作为主键（与现有表一致）
  - 使用软删除（`deleted_at` 字段）
  - 使用审计字段（`created_by`, `updated_by`）
  - 使用多对多关系（`user_roles` 表）

- **数据迁移注意事项：**
  - 需要同时连接两个数据库（Twenty 数据库和 fenghua 数据库）
  - 需要处理数据格式转换（Twenty 的字段命名 vs 新表的字段命名）
  - 需要处理外键关联（先导入主表，再导入关联表）
  - 需要验证数据完整性（检查外键关联、数据一致性）

- **测试要求：**
  - 所有迁移脚本可以独立执行
  - 所有迁移脚本支持回滚（如果可能）
  - 数据迁移脚本可以处理空数据情况
  - 数据迁移脚本可以处理部分失败情况

