# Story 16.5: 更新产品和互动记录

Status: backlog

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **所有用户**,
I want **产品和互动记录正常工作**,
So that **系统可以独立运行，无需依赖 Twenty CRM 的 workspace 概念**.

## Acceptance Criteria

1. **Given** 产品和互动记录表已存在
   **When** 开发团队更新表结构
   **Then** 移除 `workspace_id` 字段（从 `products` 表）
   **And** 移除 `workspace_id` 字段（从 `product_customer_interactions` 表）
   **And** 移除 `workspace_id` 字段（从 `file_attachments` 表）
   **And** 添加 `created_by` 和 `updated_by` 字段（如果不存在）
   **And** 更新 `customer_id` 外键关联到新的 `companies` 表

2. **Given** 产品服务需要更新
   **When** 开发团队重构 `ProductsService`
   **Then** 移除 `getWorkspaceId()` 方法
   **And** 移除对 `TwentyClientService` 的依赖
   **And** 使用 `userId` 替代 `workspaceId` 进行数据隔离
   **And** 所有产品查询使用 `created_by` 字段过滤

3. **Given** 互动记录服务需要更新
   **When** 开发团队重构互动记录服务
   **Then** 更新 `customer_id` 外键关联到新的 `companies` 表
   **And** 移除 `workspace_id` 依赖
   **And** 所有互动记录查询正常工作

## Tasks / Subtasks

- [ ] Task 1: 执行数据库迁移脚本 (AC: #1)
  - [ ] 执行 `006-remove-workspace-dependencies.sql` 迁移脚本
  - [ ] 验证 `products` 表的 `workspace_id` 字段已移除
  - [ ] 验证 `products` 表的 `created_by` 和 `updated_by` 字段已添加
  - [ ] 验证 `product_customer_interactions` 表的 `workspace_id` 字段已移除
  - [ ] 验证 `product_customer_interactions` 表的 `customer_id` 外键已更新
  - [ ] 验证 `file_attachments` 表的 `workspace_id` 字段已移除

- [ ] Task 2: 重构 ProductsService (AC: #2)
  - [ ] 移除 `getWorkspaceId()` 方法
  - [ ] 移除 `TwentyClientService` 依赖
  - [ ] 更新 `findAll()` 方法：
    - [ ] 使用 `created_by` 字段替代 `workspace_id` 进行数据隔离
    - [ ] 从 JWT token 获取 `userId`
    - [ ] 查询时过滤 `created_by = userId`
  - [ ] 更新 `create()` 方法：
    - [ ] 设置 `created_by` 字段（从 JWT token 获取 `userId`）
    - [ ] 移除 `workspace_id` 相关逻辑
  - [ ] 更新 `update()` 方法：
    - [ ] 设置 `updated_by` 字段（从 JWT token 获取 `userId`）
    - [ ] 移除 `workspace_id` 相关逻辑
  - [ ] 更新所有其他方法（移除 `workspace_id` 相关逻辑）

- [ ] Task 3: 更新 ProductsModule (AC: #2)
  - [ ] 移除 `TwentyClientModule` 导入
  - [ ] 验证模块可以正常启动

- [ ] Task 4: 更新互动记录服务（如果存在）(AC: #3)
  - [ ] 查找互动记录服务文件
  - [ ] 更新 `customer_id` 外键关联到新的 `companies` 表
  - [ ] 移除 `workspace_id` 依赖
  - [ ] 更新所有查询方法（移除 `workspace_id` 过滤）
  - [ ] 更新创建方法（设置 `created_by` 字段）

- [ ] Task 5: 更新前端产品管理页面 (AC: #2)
  - [ ] 检查前端是否需要更新（通常不需要，因为 API 端点不变）
  - [ ] 验证产品列表可以正常显示
  - [ ] 验证产品创建可以正常工作
  - [ ] 验证产品更新可以正常工作

- [ ] Task 6: 测试产品和互动记录 (AC: #1, #2, #3)
  - [ ] 测试产品列表查询（使用 `created_by` 过滤）
  - [ ] 测试产品创建（设置 `created_by` 字段）
  - [ ] 测试产品更新（设置 `updated_by` 字段）
  - [ ] 测试互动记录查询（关联到新的 `companies` 表）
  - [ ] 测试互动记录创建（关联到新的 `companies` 表）
  - [ ] 验证所有功能正常工作

## Dev Notes

- **参考文档：**
  - 重构计划：`_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`（阶段 5）
  - 数据库迁移脚本：`fenghua-backend/migrations/006-remove-workspace-dependencies.sql`

- **关键实现点：**
  - 数据隔离：使用 `created_by` 字段替代 `workspace_id` 进行数据隔离
  - 外键关联：`customer_id` 现在关联到新的 `companies` 表
  - 审计字段：使用 `created_by` 和 `updated_by` 记录操作者

- **数据隔离逻辑：**
  ```typescript
  // 查询产品时，使用 created_by 过滤
  const products = await this.prisma.product.findMany({
    where: {
      deleted_at: null,
      created_by: userId, // 替代 workspace_id
    },
  });
  ```

- **迁移注意事项：**
  - 执行迁移前，确保备份数据库
  - 迁移后，需要更新现有数据的 `created_by` 字段（如果有数据）
  - 外键约束更新可能需要先删除旧约束，再创建新约束

- **测试要求：**
  - 单元测试：测试 `ProductsService` 的所有方法
  - 集成测试：测试产品和互动记录管理流程
  - E2E 测试：测试完整的产品管理流程

