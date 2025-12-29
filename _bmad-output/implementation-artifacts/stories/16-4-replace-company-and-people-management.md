# Story 16.4: 替换客户和联系人管理

Status: backlog

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **所有用户**,
I want **管理客户和联系人**,
So that **系统可以独立管理客户数据，无需依赖 Twenty CRM**.

## Acceptance Criteria

1. **Given** 用户需要查看客户列表
   **When** 用户访问客户管理页面
   **Then** 系统显示客户列表（从 `companies` 表查询）
   **And** 系统根据用户角色过滤客户（前端专员只看到采购商，后端专员只看到供应商）
   **And** 系统支持按客户类型筛选（供应商/采购商）
   **And** 系统支持搜索客户（按名称、域名、行业）
   **And** 系统显示客户基本信息（名称、类型、行业、规模、联系方式）

2. **Given** 用户需要创建客户
   **When** 用户提供客户信息（名称、类型、地址、联系方式等）
   **Then** 系统验证必填字段（名称、客户类型）
   **And** 系统创建客户记录（在 `companies` 表）
   **And** 系统记录创建者（`created_by` 字段）
   **And** 系统返回创建的客户信息

3. **Given** 用户需要更新客户
   **When** 用户修改客户信息
   **Then** 系统更新客户记录（在 `companies` 表）
   **And** 系统记录更新者（`updated_by` 字段）
   **And** 系统返回更新后的客户信息

4. **Given** 用户需要删除客户
   **When** 用户删除客户
   **Then** 系统软删除客户（设置 `deleted_at` 字段）
   **And** 系统保留客户数据（用于审计）

5. **Given** 用户需要管理联系人
   **When** 用户查看联系人列表（按客户）
   **Then** 系统显示联系人列表（从 `people` 表查询，关联到客户）
   **And** 系统支持创建、更新、删除联系人
   **And** 系统验证联系人必填字段（姓名、关联客户）

## Tasks / Subtasks

- [ ] Task 1: 创建 CompaniesService (AC: #1, #2, #3, #4)
  - [ ] 创建 `fenghua-backend/src/companies/companies.service.ts`
  - [ ] 添加 `PrismaService` 依赖
  - [ ] 实现 `findAll()` 方法：
    - [ ] 查询客户列表（从 `companies` 表）
    - [ ] 根据用户角色过滤（前端专员只看到采购商，后端专员只看到供应商）
    - [ ] 支持按客户类型筛选
    - [ ] 支持搜索（按名称、域名、行业）
    - [ ] 返回客户列表（包含联系人信息）
  - [ ] 实现 `create()` 方法：
    - [ ] 验证必填字段
    - [ ] 创建客户记录（在 `companies` 表）
    - [ ] 记录创建者
    - [ ] 返回创建的客户信息
  - [ ] 实现 `update()` 方法：
    - [ ] 更新客户记录（在 `companies` 表）
    - [ ] 记录更新者
    - [ ] 返回更新后的客户信息
  - [ ] 实现 `remove()` 方法：
    - [ ] 软删除客户（设置 `deleted_at` 字段）
  - [ ] 实现 `search()` 方法：
    - [ ] 支持模糊搜索（按名称、域名、行业）
    - [ ] 支持按客户类型筛选

- [ ] Task 2: 创建 PeopleService (AC: #5)
  - [ ] 创建 `fenghua-backend/src/people/people.service.ts`
  - [ ] 添加 `PrismaService` 依赖
  - [ ] 实现 `findAll()` 方法：
    - [ ] 查询联系人列表（从 `people` 表，关联到客户）
    - [ ] 支持按客户筛选
    - [ ] 返回联系人列表
  - [ ] 实现 `create()` 方法：
    - [ ] 验证必填字段（姓名、关联客户）
    - [ ] 创建联系人记录（在 `people` 表）
    - [ ] 记录创建者
    - [ ] 返回创建的联系人信息
  - [ ] 实现 `update()` 方法：
    - [ ] 更新联系人记录（在 `people` 表）
    - [ ] 记录更新者
    - [ ] 返回更新后的联系人信息
  - [ ] 实现 `remove()` 方法：
    - [ ] 软删除联系人（设置 `deleted_at` 字段）

- [ ] Task 3: 创建 CompaniesController (AC: #1, #2, #3, #4)
  - [ ] 创建 `fenghua-backend/src/companies/companies.controller.ts`
  - [ ] 实现 `GET /api/companies` 端点（获取客户列表）
  - [ ] 实现 `POST /api/companies` 端点（创建客户）
  - [ ] 实现 `GET /api/companies/:id` 端点（获取客户详情）
  - [ ] 实现 `PUT /api/companies/:id` 端点（更新客户）
  - [ ] 实现 `DELETE /api/companies/:id` 端点（删除客户）
  - [ ] 实现 `GET /api/companies/search` 端点（搜索客户）
  - [ ] 添加认证 Guard（`@UseGuards(JwtAuthGuard)`）
  - [ ] 添加权限验证（如果需要）

- [ ] Task 4: 创建 PeopleController (AC: #5)
  - [ ] 创建 `fenghua-backend/src/people/people.controller.ts`
  - [ ] 实现 `GET /api/people` 端点（获取联系人列表）
  - [ ] 实现 `POST /api/people` 端点（创建联系人）
  - [ ] 实现 `GET /api/people/:id` 端点（获取联系人详情）
  - [ ] 实现 `PUT /api/people/:id` 端点（更新联系人）
  - [ ] 实现 `DELETE /api/people/:id` 端点（删除联系人）
  - [ ] 添加认证 Guard

- [ ] Task 5: 创建模块 (AC: #1, #2, #3, #4, #5)
  - [ ] 创建 `fenghua-backend/src/companies/companies.module.ts`
  - [ ] 创建 `fenghua-backend/src/people/people.module.ts`
  - [ ] 在 `app.module.ts` 中导入新模块
  - [ ] 验证模块可以正常启动

- [ ] Task 6: 创建 DTOs (AC: #1, #2, #3, #4, #5)
  - [ ] 创建 `fenghua-backend/src/companies/dto/create-company.dto.ts`
  - [ ] 创建 `fenghua-backend/src/companies/dto/update-company.dto.ts`
  - [ ] 创建 `fenghua-backend/src/companies/dto/company-response.dto.ts`
  - [ ] 创建 `fenghua-backend/src/people/dto/create-person.dto.ts`
  - [ ] 创建 `fenghua-backend/src/people/dto/update-person.dto.ts`
  - [ ] 创建 `fenghua-backend/src/people/dto/person-response.dto.ts`

- [ ] Task 7: 更新前端客户管理页面 (AC: #1, #2, #3, #4)
  - [ ] 创建或更新 `fenghua-frontend/src/companies/CompaniesPage.tsx`
  - [ ] 更新 API 调用使用新的端点
  - [ ] 实现客户列表显示
  - [ ] 实现客户创建表单
  - [ ] 实现客户编辑表单
  - [ ] 实现客户删除功能
  - [ ] 实现客户搜索功能
  - [ ] 实现数据隔离（根据用户角色过滤）

- [ ] Task 8: 更新前端联系人管理页面 (AC: #5)
  - [ ] 创建或更新 `fenghua-frontend/src/people/PeoplePage.tsx`
  - [ ] 更新 API 调用使用新的端点
  - [ ] 实现联系人列表显示
  - [ ] 实现联系人创建表单
  - [ ] 实现联系人编辑表单
  - [ ] 实现联系人删除功能

- [ ] Task 9: 测试客户和联系人管理 (AC: #1, #2, #3, #4, #5)
  - [ ] 测试客户列表查询（包含数据隔离）
  - [ ] 测试客户创建
  - [ ] 测试客户更新
  - [ ] 测试客户删除（软删除）
  - [ ] 测试客户搜索
  - [ ] 测试联系人列表查询
  - [ ] 测试联系人创建
  - [ ] 测试联系人更新
  - [ ] 测试联系人删除

## Dev Notes

- **参考文档：**
  - 重构计划：`_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`（阶段 4）
  - 代码示例：重构计划中的详细实现代码

- **技术栈：**
  - Prisma（数据库查询）
  - NestJS（RESTful API）

- **关键实现点：**
  - 数据隔离：根据用户角色过滤客户（前端专员只看到采购商，后端专员只看到供应商）
  - 客户查询应包含联系人信息（使用 Prisma `include`）
  - 软删除应设置 `deleted_at` 字段，查询时过滤已删除记录
  - 搜索功能应支持模糊搜索（使用 Prisma `contains` 和 `mode: 'insensitive'`）

- **数据隔离逻辑：**
  ```typescript
  // 前端专员：只看到采购商
  if (userRole === 'FRONTEND_SPECIALIST') {
    where.customer_type = 'BUYER';
  }
  // 后端专员：只看到供应商
  else if (userRole === 'BACKEND_SPECIALIST') {
    where.customer_type = 'SUPPLIER';
  }
  // 总监和管理员：看到所有客户
  ```

- **测试要求：**
  - 单元测试：测试 `CompaniesService` 和 `PeopleService` 的所有方法
  - 集成测试：测试客户和联系人管理流程
  - E2E 测试：测试完整的客户管理流程（包含数据隔离）

