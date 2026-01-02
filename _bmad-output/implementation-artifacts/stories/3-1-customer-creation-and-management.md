# Story 3.1: 客户创建和管理（按角色）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **前端专员/后端专员/总监/管理员**,
I want **创建、编辑和删除客户记录**,
So that **我可以管理我负责的客户信息，建立和维护客户关系**.

## Acceptance Criteria

1. **Given** 前端专员已登录系统
   **When** 前端专员访问客户管理页面
   **Then** 系统只显示采购商类型的客户（customer_type = 'BUYER'）
   **And** 系统不显示供应商类型的客户
   **And** 前端专员可以点击"创建新采购商"按钮

2. **Given** 后端专员已登录系统
   **When** 后端专员访问客户管理页面
   **Then** 系统只显示供应商类型的客户（customer_type = 'SUPPLIER'）
   **And** 系统不显示采购商类型的客户
   **And** 后端专员可以点击"创建新供应商"按钮

3. **Given** 总监或管理员已登录系统
   **When** 总监或管理员访问客户管理页面
   **Then** 系统显示所有类型的客户（采购商和供应商）
   **And** 系统提供客户类型筛选功能（全部/采购商/供应商）
   **And** 总监或管理员可以点击"创建新客户"按钮

4. **Given** 用户点击"创建新客户"
   **When** 系统显示客户创建表单
   **Then** 表单包含必填字段：客户名称、客户代码、客户类型
   **And** 表单包含可选字段：地址、联系方式、行业、规模、备注等
   **And** 前端专员只能选择"采购商"类型（customer_type = 'BUYER'），后端专员只能选择"供应商"类型（customer_type = 'SUPPLIER'），总监和管理员可以选择任意类型（'BUYER' 或 'SUPPLIER'）

5. **Given** 用户填写客户创建表单
   **When** 用户提交表单，所有必填字段已填写且格式正确
   **Then** 系统创建客户记录并保存到 `companies` 表
   **And** 客户信息保存到数据库，客户类型字段（customer_type）正确设置
   **And** 系统显示成功消息"客户创建成功"
   **And** 新客户出现在客户列表中
   **And** 系统根据用户角色自动过滤显示（前端专员只看到采购商，后端专员只看到供应商）

6. **Given** 用户填写客户创建表单
   **When** 用户提交表单，但必填字段缺失或客户代码格式不正确
   **Then** 系统显示验证错误消息（如"客户名称不能为空"、"客户代码格式不正确"）
   **And** 客户不被创建
   **And** 表单保持填写状态，允许用户修正错误

7. **Given** 客户已存在
   **When** 用户在客户列表中选择客户并点击"编辑"
   **Then** 系统显示客户编辑表单，预填充现有客户信息
   **And** 用户只能编辑自己角色权限范围内的客户
   **And** 前端专员不能编辑供应商，后端专员不能编辑采购商
   **And** 用户提交修改后，系统更新客户信息并显示成功消息

8. **Given** 客户已存在且有关联的互动记录
   **When** 用户尝试删除客户
   **Then** 系统显示确认对话框"确定要删除客户 [客户名称] 吗？"
   **And** 系统检查客户是否有关联的互动记录（查询 `product_customer_interactions` 表）
   **And** 如果有关联记录，系统执行软删除（标记 `deleted_at`），保留历史记录
   **And** 如果无关联记录，系统可以执行硬删除（DELETE FROM companies）
   **And** 客户从客户列表中移除（或标记为 deleted）
   **And** 系统显示成功消息"客户删除成功"

## Tasks / Subtasks

- [x] Task 1: 后端客户服务模块 (AC: #5, #6, #7, #8)
  - [x] 创建 CustomersModule（或 CompaniesModule）✅
  - [x] 创建 CustomersService（管理客户 CRUD 操作）✅
  - [x] 创建 CustomersController（提供客户管理端点，使用 @UseGuards(JwtAuthGuard)）✅
  - [x] 实现客户数据模型（DTOs: CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto, CustomerQueryDto）✅
  - [x] 实现客户创建逻辑（验证必填字段，验证客户代码格式，保存到 companies 表）✅
  - [x] 实现客户更新逻辑（验证权限，更新 updated_at 和 updated_by）✅
  - [x] 实现客户删除逻辑（检查关联记录，软删除或硬删除）✅
  - [x] 实现客户查询逻辑（列表查询，支持过滤和分页，默认每页 20 条）✅

- [x] Task 2: 基于角色的数据过滤集成 (AC: #1, #2, #3, #5, #7)
  - [x] 在 CustomersService 中注入 PermissionService ✅
  - [x] 实现角色过滤逻辑（使用 PermissionService.getDataAccessFilter()）✅
  - [x] 在查询方法中应用数据过滤（根据用户角色自动添加 customer_type 过滤条件）✅
  - [x] 前端专员：只查询 customer_type = 'BUYER' ✅
  - [x] 后端专员：只查询 customer_type = 'SUPPLIER' ✅
  - [x] 总监/管理员：不添加过滤条件（可查看所有）✅
  - [x] 在创建/编辑/删除操作中验证权限（前端专员不能创建/编辑供应商，后端专员不能创建/编辑采购商）✅

- [x] Task 3: 数据库集成 (AC: #5, #7, #8)
  - [x] 确认 companies 表已创建（使用迁移脚本 006-create-companies-and-people-tables.sql）✅
  - [x] **创建新迁移脚本添加 customer_code 字段**（必需，Epic 要求客户代码为必填字段）✅
    - [x] 创建迁移脚本：`012-add-customer-code-to-companies.sql` ✅
    - [x] 添加 `customer_code VARCHAR(50)` 列（迁移脚本已执行）✅
    - [x] 创建唯一索引：`CREATE UNIQUE INDEX idx_companies_customer_code ON companies(customer_code) WHERE deleted_at IS NULL`（迁移脚本已执行）✅
  - [x] 实现数据库连接（使用 `pg.Pool`，参考 ProductsService.initializeDatabaseConnection() 模式）✅
  - [x] 实现客户创建 SQL（INSERT INTO companies，包含 customer_type 和 customer_code 字段）✅
  - [x] 实现客户更新 SQL（UPDATE companies，更新 updated_at 和 updated_by）✅
  - [x] 实现客户软删除 SQL（UPDATE companies SET deleted_at = NOW()）✅
  - [x] 实现客户硬删除 SQL（DELETE FROM companies WHERE id = $1 AND 无关联记录）✅
  - [x] 实现关联记录检查（查询 product_customer_interactions 表，检查 customer_id 匹配且 deleted_at IS NULL 的记录）✅

- [x] Task 4: 客户验证逻辑 (AC: #4, #6)
  - [x] 实现客户名称验证（必填，长度限制：1-255 字符）✅ (DTO validation)
  - [x] 实现客户代码验证（必填，格式验证：字母数字组合，长度限制：1-50 字符，唯一性检查）✅ (DTO validation + service check)
  - [x] 实现客户类型验证（必填，值必须是 'BUYER' 或 'SUPPLIER'）✅ (DTO enum validation)
  - [x] 实现地址验证（可选，长度限制：最大 1000 字符）✅ (DTO validation)
  - [x] 实现联系方式验证（可选，格式验证：电话、邮箱等）✅ (DTO validation)
  - [x] 实现行业验证（可选，长度限制：最大 100 字符）✅ (DTO validation)
  - [x] 实现规模验证（可选，整数类型，范围：1-1000000）✅ (DTO validation)
  - [x] 实现备注验证（可选，长度限制：最大 5000 字符）✅ (DTO validation)

- [x] Task 5: 前端客户管理页面 (AC: #1, #2, #3)
  - [x] 创建客户管理页面组件 (CustomerManagementPage.tsx) ✅
  - [x] 创建客户列表组件 (CustomerList.tsx) ✅
  - [x] 实现客户列表显示（表格形式，显示名称、客户代码、客户类型、地址、联系方式等）✅
  - [x] 实现"创建新客户"按钮（根据用户角色显示不同文本：前端专员显示"创建新采购商"，后端专员显示"创建新供应商"，总监/管理员显示"创建新客户"）✅
  - [x] 实现客户类型筛选功能（仅总监/管理员可见，支持全部/采购商/供应商筛选）✅
  - [x] 实现客户列表分页 ✅
  - [x] 实现基于角色的数据过滤（前端显示，后端 API 已过滤）✅

- [x] Task 6: 前端客户创建表单 (AC: #4, #5, #6)
  - [x] 创建客户创建表单组件 (CustomerCreateForm.tsx) ✅
  - [x] 实现必填字段：客户名称（1-255 字符）、客户代码（格式验证）、客户类型（根据用户角色限制选项）✅
  - [x] 实现可选字段：地址（最大 1000 字符）、联系方式、行业（最大 100 字符）、规模（整数，1-1000000）、备注（最大 5000 字符）✅
  - [x] 实现客户类型字段限制（前端专员只能选择"采购商"，后端专员只能选择"供应商"，总监/管理员可以选择任意类型）✅
  - [x] 实现表单验证（前端验证：自定义验证逻辑，后端验证：DTO validation）✅
  - [x] 实现错误消息显示（显示验证错误和 API 错误）✅
  - [x] 实现成功消息显示（创建成功后显示提示并刷新列表）✅

- [x] Task 7: 前端客户编辑表单 (AC: #7)
  - [x] 创建客户编辑表单组件 (CustomerEditForm.tsx) ✅
  - [x] 实现表单预填充（从客户详情加载数据）✅
  - [x] 实现权限验证（前端检查：前端专员不能编辑供应商，后端专员不能编辑采购商）✅
  - [x] 实现客户更新 API 调用 ✅
  - [x] 实现成功消息显示 ✅

- [x] Task 8: 前端客户删除功能 (AC: #8)
  - [x] 实现删除确认对话框 ✅
  - [x] 实现关联记录检查（后端自动检查，前端显示提示信息）✅
  - [x] 实现删除 API 调用（检查关联记录，软删除或硬删除）✅
  - [x] 实现删除后列表刷新 ✅
  - [x] 实现成功消息显示 ✅

- [x] Task 9: 前端客户服务集成 (AC: #1, #2, #3, #5, #7, #8)
  - [x] 创建客户服务 (customers.service.ts) - 前端 API 调用 ✅
  - [x] 实现客户列表查询 API 调用（包含角色过滤，支持分页和筛选）✅
  - [x] 实现客户创建 API 调用 ✅
  - [x] 实现客户更新 API 调用 ✅
  - [x] 实现客户删除 API 调用 ✅
  - [x] 实现客户详情查询 API 调用 ✅

- [x] Task 10: 审计日志集成 (AC: #5, #7, #8)
  - [x] 集成 AuditService（记录客户创建、更新、删除操作）✅
  - [x] 记录操作者信息（created_by, updated_by）✅
  - [x] 记录变更前后值（更新和删除操作）✅

## Dev Notes

- **Relevant architecture patterns and constraints:**
  - **Native Stack Architecture:** Use custom backend (`fenghua-backend`) and frontend (`fenghua-frontend`) with direct PostgreSQL database access. No external dependencies.
  - **Database:** Use `companies` table (migration script: `fenghua-backend/migrations/006-create-companies-and-people-tables.sql`).
  - **Database Connection Pattern:** Reference `ProductsService.initializeDatabaseConnection()` pattern:
    - Initialize pool in constructor using `ConfigService` for `DATABASE_URL`
    - Implement `OnModuleDestroy` interface for cleanup
    - Use `pg.Pool` with max connections (typically 10)
    - See: `fenghua-backend/src/products/products.service.ts:36-54`
  - **Data Isolation:** Companies table uses `created_by` for user-level isolation (not workspace_id)
    - All queries should filter by user's allowed customer_type via PermissionService
    - No workspace_id needed - system uses created_by for data ownership
  - **Role-Based Data Filtering:** Use `PermissionService.getDataAccessFilter()` to automatically filter data based on user role:
    - Frontend Specialist: Only `customer_type = 'BUYER'`
    - Backend Specialist: Only `customer_type = 'SUPPLIER'`
    - Director/Admin: No filter (can access all)
  - **Customer Type Case Conversion:** Database stores uppercase ('BUYER', 'SUPPLIER'), but PermissionService returns lowercase ('buyer', 'supplier')
    - **Implementation:** Convert to uppercase before query: `const customerTypeUpper = dataFilter.customerType.toUpperCase()`
    - **Example:**
      ```typescript
      const dataFilter = await this.permissionService.getDataAccessFilter(token);
      if (dataFilter?.customerType) {
        const customerTypeUpper = dataFilter.customerType.toUpperCase(); // 'buyer' -> 'BUYER'
        query += ` AND customer_type = $${paramIndex}`;
        queryParams.push(customerTypeUpper);
        paramIndex++;
      }
      ```
  - **User ID Extraction:** Use `request.user.id` from JwtAuthGuard
    - JwtAuthGuard automatically attaches user to request: `request.user = { id, email, role, ... }`
    - In controller: `@Get() async findAll(@Req() req: Request) { const userId = req.user.id; }`
    - For created_by/updated_by: `const userId = req.user.id;` then use in SQL: `created_by = $1`
  - **Soft Delete:** Implement soft delete strategy (mark `deleted_at`) to preserve historical interaction records.
  - **Customer Type Constraint:** `customer_type` field must be 'BUYER' or 'SUPPLIER' (enforced by database CHECK constraint).
  - **Audit Logging:** Reuse existing `AuditService` from Story 1.4.
  - **Error Handling:** Use try-catch blocks, return appropriate HTTP status codes:
    - `BadRequestException` for validation errors
    - `NotFoundException` for missing resources
    - `ConflictException` for duplicate entries (e.g., duplicate customer_code)
    - See `ProductsService` for error handling examples

- **Source tree components to touch:**
  - `fenghua-backend/src/customers/` (or `companies/`): New module for customer management.
  - `fenghua-backend/migrations/006-create-companies-and-people-tables.sql`: Database migration (already created, verify execution).
  - `fenghua-backend/migrations/012-add-customer-code-to-companies.sql`: **Migration created** - Add customer_code field.
  - `fenghua-frontend/src/customers/`: New module for customer management UI.
  - `fenghua-backend/src/permission/permission.service.ts`: Reuse existing PermissionService for role-based filtering.
  - `fenghua-backend/src/products/products.service.ts`: Reference for database connection pattern and error handling.

- **Testing standards summary:**
  - Unit tests for `customers.service.ts`, `customers.controller.ts` (backend).
  - Unit tests for customer components (frontend).
  - Integration tests for customer CRUD endpoints with role-based filtering.
  - E2E tests for customer creation, editing, and deletion flows with different user roles.

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Custom code in `fenghua-backend` and `fenghua-frontend`
- **Detected Conflicts or Variances:**
  - **Database:** Use custom `companies` table instead of Twenty CRM Custom Objects API (as per architecture decision to remove Twenty dependency)
  - **Customer Type Values:** Use 'BUYER' and 'SUPPLIER' (uppercase) as per database schema, but PermissionService returns lowercase - need conversion
  - **Role-Based Filtering:** Must use PermissionService.getDataAccessFilter() in all queries to ensure data isolation

### References

- **Epic Definition:** [epics.md#Story 3.1](_bmad-output/epics.md#story-31-客户创建和管理按角色)
- **Architecture Data Model:** [api-integration-architecture.md](docs/api-integration-architecture.md)
- **Database Schema:** [database-schema-design.md#客户表](docs/database-schema-design.md) - Note: Use `companies` table from migration 006
- **Migration Script:** [006-create-companies-and-people-tables.sql](../fenghua-backend/migrations/006-create-companies-and-people-tables.sql)
- **PermissionService:** [permission.service.ts](../fenghua-backend/src/permission/permission.service.ts) - Reuse existing permission service for role-based filtering
- **Previous Story Pattern:** [2-1-product-creation-and-management.md](2-1-product-creation-and-management.md) - Reference for CRUD implementation pattern

### Key Technical Details

- **Database Schema:**
  - Table: `companies`
  - Primary Key: `id` (UUID)
  - Required Fields: `name`, `customer_code` (VARCHAR(50), unique), `customer_type` ('BUYER' or 'SUPPLIER')
  - Optional Fields: `domain_name`, `address`, `city`, `state`, `country`, `postal_code`, `industry`, `employees`, `website`, `phone`, `notes`
  - Status Field: `deleted_at` (TIMESTAMP) - for soft delete
  - Audit Fields: `created_at`, `updated_at`, `created_by`, `updated_by`
  - Constraints:
    - `customer_type` CHECK constraint (must be 'BUYER' or 'SUPPLIER')
    - `customer_code` UNIQUE constraint (via index `idx_companies_customer_code`)
  - **Indexes (from migration 006):**
    - `idx_companies_name` - Use for name-based searches (automatically used in WHERE name LIKE ...)
    - `idx_companies_customer_type` - Automatically used in WHERE customer_type = ... queries
    - `idx_companies_deleted_at` - Automatically used in WHERE deleted_at IS NULL queries
    - `idx_companies_customer_code` - Use for customer_code lookups and uniqueness checks
  - **Note:** `customer_code` field requires new migration script (not in migration 006)

- **Role-Based Data Filtering:**
  - Use `PermissionService.getDataAccessFilter(token)` to get filter criteria
  - Returns `{ customerType: 'buyer' }`, `{ customerType: 'supplier' }`, or `null` (no filter)
  - **Important:** Database stores uppercase ('BUYER', 'SUPPLIER'), but PermissionService returns lowercase ('buyer', 'supplier') - need conversion
  - Apply filter in all queries: `WHERE customer_type = $1 AND deleted_at IS NULL`
  - Apply filter in create/update operations: Validate user can only create/edit their allowed customer type

- **Customer Code Validation:**
  - Format: Alphanumeric characters, 1-50 characters
  - Uniqueness: Must be unique globally (enforced by unique index `idx_companies_customer_code`)
  - Validation: Use regex `/^[a-zA-Z0-9]{1,50}$/` for format validation
  - **Database Migration:** Migration script created: `012-add-customer-code-to-companies.sql`
    ```sql
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS customer_code VARCHAR(50);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_customer_code 
    ON companies(customer_code) WHERE deleted_at IS NULL;
    ```
    **Note:** Execute migration script before implementing customer creation functionality.

- **Soft Delete Strategy:**
  - Check for associated records in `product_customer_interactions` table
  - If associations exist: Set `deleted_at = NOW()` (soft delete)
  - If no associations: Can perform hard delete (DELETE FROM companies)
  - All queries must filter: `WHERE deleted_at IS NULL`

- **API Endpoints:**
  - `GET /api/customers` - List customers (with role-based filtering, pagination, search)
  - `GET /api/customers/:id` - Get customer details
  - `POST /api/customers` - Create customer (with role-based validation)
  - `PUT /api/customers/:id` - Update customer (with role-based validation)
  - `DELETE /api/customers/:id` - Delete customer (soft or hard delete based on associations)

- **Frontend Components:**
  - `CustomerManagementPage.tsx` - Main page component
  - `CustomerList.tsx` - Customer list display
  - `CustomerCreateForm.tsx` - Create form
  - `CustomerEditForm.tsx` - Edit form
  - `customers.service.ts` - API service

- **Previous Story Learnings:**
  - From Story 2.1: Use `pg.Pool` for database connection, implement soft delete strategy, reuse AuditService
  - From Story 2.8: Implement proper validation, use DTOs for request/response, implement pagination
  - **Database Connection Pattern:** 
    - Use dependency injection, initialize pool in service constructor
    - Reference: `ProductsService.initializeDatabaseConnection()` (lines 36-54)
    - Use `ConfigService` for `DATABASE_URL`, implement `OnModuleDestroy` for cleanup
  - **Error Handling Pattern:**
    - Use try-catch blocks, return appropriate HTTP status codes
    - `BadRequestException` for validation errors (e.g., invalid customer_code format)
    - `NotFoundException` for missing resources (e.g., customer not found)
    - `ConflictException` for duplicate entries (e.g., duplicate customer_code)
    - Reference: `ProductsService` error handling examples
  - **User ID Pattern:**
    - Extract from `request.user.id` (set by JwtAuthGuard)
    - Use for `created_by` and `updated_by` fields in SQL queries
    - Reference: `ProductsService` line 222 for userId extraction pattern

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (via Cursor)

### Debug Log References

N/A

### Completion Notes List

- All backend CRUD operations implemented with role-based filtering
- Database migration executed successfully (012-add-customer-code-to-companies.sql)
- Frontend components created with role-based UI restrictions
- Backward compatibility maintained: Controller supports both `/customers` and `/companies` routes
- All unit tests passing (10/10)
- Frontend route added to App.tsx and HomePage quick access

### File List

**Backend Files:**
- `fenghua-backend/src/companies/dto/create-customer.dto.ts` (NEW)
- `fenghua-backend/src/companies/dto/update-customer.dto.ts` (NEW)
- `fenghua-backend/src/companies/dto/customer-response.dto.ts` (NEW)
- `fenghua-backend/src/companies/dto/customer-query.dto.ts` (NEW)
- `fenghua-backend/src/companies/companies.service.ts` (MODIFIED - extended with full CRUD)
- `fenghua-backend/src/companies/companies.controller.ts` (MODIFIED - extended with all endpoints)
- `fenghua-backend/src/companies/companies-compat.controller.ts` (NEW - backward compatibility for /companies/:id route)
- `fenghua-backend/src/companies/companies.module.ts` (MODIFIED - added PermissionModule and AuditModule)
- `fenghua-backend/src/companies/companies.controller.spec.ts` (NEW - unit tests)
- `fenghua-backend/migrations/012-add-customer-code-to-companies.sql` (NEW - executed)

**Frontend Files:**
- `fenghua-frontend/src/customers/customers.service.ts` (NEW)
- `fenghua-frontend/src/customers/CustomerManagementPage.tsx` (NEW)
- `fenghua-frontend/src/customers/components/CustomerList.tsx` (NEW)
- `fenghua-frontend/src/customers/components/CustomerCreateForm.tsx` (NEW)
- `fenghua-frontend/src/customers/components/CustomerEditForm.tsx` (NEW)
- `fenghua-frontend/src/App.tsx` (MODIFIED - added /customers route and quick access)

**Story Files:**
- `_bmad-output/implementation-artifacts/stories/3-1-customer-creation-and-management.md` (MODIFIED)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED - status updated to done)

### Change Log

**2025-01-03: Story 3.1 Implementation Complete**
- Implemented full CRUD operations for customer management
- Added role-based data filtering (Frontend Specialist: BUYER only, Backend Specialist: SUPPLIER only, Director/Admin: all)
- Created database migration for customer_code field
- Implemented frontend components with role-based restrictions
- Added backward compatibility for `/companies/:id` route (via CompaniesCompatController)
- Fixed customer type filter bug (empty string → undefined)
- Unified API URL pattern (VITE_API_BASE_URL || VITE_BACKEND_URL)
- Added frontend route and navigation
- All tests passing (10/10)

**2025-01-03: Code Review Fixes Applied**
- Created CompaniesCompatController for backward compatibility with existing product pages
- Added /customers route to App.tsx and HomePage quick access
- Fixed customer type filter empty string bug
- Unified API URL pattern across frontend services
- Completed story documentation (File List, Change Log, Code Review section)

## Senior Developer Review (AI)

**Review Date:** 2025-01-03  
**Reviewer:** AI Code Reviewer  
**Outcome:** Changes Requested → Fixed

### Review Findings

**🔴 HIGH SEVERITY (Fixed):**
1. **Breaking Change: Backward Compatibility** - Controller changed from `/companies` to `/customers`, breaking existing product pages that call `/api/companies/:id`
   - **Fix Applied:** Created separate `CompaniesCompatController` to handle `/companies/:id` route for backward compatibility
   - **Files:** `companies-compat.controller.ts` (NEW), `companies.module.ts` (updated to register both controllers)
   - **Status:** ✅ Fixed

2. **Frontend Route Missing** - CustomerManagementPage not accessible via routing
   - **Fix Applied:** Added `/customers` route to App.tsx and quick access module
   - **Status:** ✅ Fixed

**🟡 MEDIUM SEVERITY (Fixed):**
3. **Customer Type Filter Bug** - Empty string passed to backend instead of undefined
   - **Fix Applied:** Updated onChange handler to convert empty string to undefined
   - **Status:** ✅ Fixed

4. **API URL Inconsistency** - customers.service.ts only used VITE_BACKEND_URL
   - **Fix Applied:** Updated to use `VITE_API_BASE_URL || VITE_BACKEND_URL` pattern
   - **Status:** ✅ Fixed

5. **Story Documentation Incomplete** - Dev Agent Record missing File List and Change Log
   - **Fix Applied:** Added complete File List and Change Log
   - **Status:** ✅ Fixed

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Add backward compatibility for `/companies/:id` route [companies-compat.controller.ts (NEW)]
- [x] [AI-Review][HIGH] Add frontend route for CustomerManagementPage [App.tsx]
- [x] [AI-Review][MEDIUM] Fix customer type filter empty string bug [CustomerManagementPage.tsx:225]
- [x] [AI-Review][MEDIUM] Unify API URL pattern [customers.service.ts:8]
- [x] [AI-Review][MEDIUM] Complete story documentation [3-1-customer-creation-and-management.md]

### Test Results

- ✅ Backend unit tests: 10/10 passing
- ✅ Linter: No errors
- ✅ All fixes verified

**Backend Files:**
- `fenghua-backend/src/companies/dto/create-customer.dto.ts` (NEW)
- `fenghua-backend/src/companies/dto/update-customer.dto.ts` (NEW)
- `fenghua-backend/src/companies/dto/customer-response.dto.ts` (NEW)
- `fenghua-backend/src/companies/dto/customer-query.dto.ts` (NEW)
- `fenghua-backend/src/companies/companies.service.ts` (MODIFIED - extended with full CRUD)
- `fenghua-backend/src/companies/companies.controller.ts` (MODIFIED - extended with all endpoints, added backward compatibility)
- `fenghua-backend/src/companies/companies.module.ts` (MODIFIED - added PermissionModule and AuditModule)
- `fenghua-backend/src/companies/companies.controller.spec.ts` (NEW - unit tests)
- `fenghua-backend/migrations/012-add-customer-code-to-companies.sql` (NEW - executed)

**Frontend Files:**
- `fenghua-frontend/src/customers/customers.service.ts` (NEW)
- `fenghua-frontend/src/customers/CustomerManagementPage.tsx` (NEW)
- `fenghua-frontend/src/customers/components/CustomerList.tsx` (NEW)
- `fenghua-frontend/src/customers/components/CustomerCreateForm.tsx` (NEW)
- `fenghua-frontend/src/customers/components/CustomerEditForm.tsx` (NEW)
- `fenghua-frontend/src/App.tsx` (MODIFIED - added /customers route and quick access)

**Story Files:**
- `_bmad-output/implementation-artifacts/stories/3-1-customer-creation-and-management.md` (MODIFIED)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED - status updated to done)

### Change Log

**2025-01-03: Story 3.1 Implementation Complete**
- Implemented full CRUD operations for customer management
- Added role-based data filtering (Frontend Specialist: BUYER only, Backend Specialist: SUPPLIER only, Director/Admin: all)
- Created database migration for customer_code field
- Implemented frontend components with role-based restrictions
- Added backward compatibility for `/companies/:id` route
- Fixed customer type filter bug (empty string → undefined)
- Unified API URL pattern (VITE_API_BASE_URL || VITE_BACKEND_URL)
- Added frontend route and navigation
- All tests passing

