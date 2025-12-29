# Story 2.1: 产品创建和管理

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **系统管理员**,
I want **创建、编辑和删除产品对象**,
So that **我可以管理系统中的产品信息，为业务互动提供产品基础数据**.

## Acceptance Criteria

1. **Given** 管理员已登录系统
   **When** 管理员访问产品管理页面
   **Then** 系统显示产品列表
   **And** 管理员可以点击"创建新产品"按钮

2. **Given** 管理员点击"创建新产品"
   **When** 系统显示产品创建表单
   **Then** 表单包含必填字段：产品名称、产品HS编码、产品类别
   **And** 表单包含可选字段：产品描述、产品规格、产品图片等
   **And** 系统提供产品类别下拉列表（从可维护的类别列表中选择，显示类别名称和HS编码）
   **And** 当管理员选择产品类别时，系统自动填充对应的HS编码
   **And** 当管理员输入HS编码时，系统自动查找并填充对应的产品类别（如果存在）
   **And** 产品规格使用表格形式输入（可动态添加/删除行，每行包含属性名和属性值）

3. **Given** 管理员填写产品创建表单
   **When** 管理员提交表单，所有必填字段已填写且格式正确
   **Then** 系统使用自定义数据库表（products）创建产品对象
   **And** 产品信息保存到数据库
   **And** 系统显示成功消息"产品创建成功"
   **And** 新产品出现在产品列表中

4. **Given** 管理员填写产品创建表单
   **When** 管理员提交表单，但必填字段缺失或产品HS编码格式不正确
   **Then** 系统显示验证错误消息（如"产品名称不能为空"、"HS编码格式不正确"）
   **And** 产品不被创建
   **And** 表单保持填写状态，允许管理员修正错误

5. **Given** 产品已存在
   **When** 管理员在产品列表中选择产品并点击"编辑"
   **Then** 系统显示产品编辑表单，预填充现有产品信息
   **And** 管理员可以修改产品信息（名称、描述、规格等，但不能修改产品HS编码）
   **And** 管理员提交修改后，系统更新产品信息并显示成功消息

6. **Given** 产品已存在且有关联的互动记录
   **When** 管理员尝试删除产品
   **Then** 系统显示确认对话框"确定要删除产品 [产品名称] 吗？"
   **And** 系统检查产品是否有关联的互动记录
   **And** 如果有关联记录，系统执行软删除（标记为 inactive），保留历史记录
   **And** 如果无关联记录，系统可以执行硬删除
   **And** 产品从产品列表中移除（或标记为 inactive）
   **And** 系统显示成功消息"产品删除成功"

7. **Given** 产品被标记为 inactive
   **When** 用户搜索产品
   **Then** inactive 产品默认不显示在搜索结果中
   **And** 管理员可以选择显示 inactive 产品

## Tasks / Subtasks

- [x] Task 1: 后端产品服务 (AC: #3, #4, #5, #6)
  - [x] 创建产品模块 (products.module.ts) - 导入 ConfigModule, TwentyClientModule
  - [x] 创建产品服务 (products.service.ts) - 管理产品 CRUD 操作
  - [x] 实现 workspace_id 获取方法（使用 TwentyClientService 查询）
  - [x] 实现数据库连接初始化（使用 pg.Pool，参考 HealthService 模式）
  - [x] 创建产品控制器 (products.controller.ts) - 提供产品管理端点（使用 @UseGuards(JwtAuthGuard, AdminGuard)）
  - [x] 实现产品数据模型（DTOs: CreateProductDto, UpdateProductDto, ProductResponseDto, ProductQueryDto）
  - [x] 实现产品创建逻辑（获取 workspace_id，验证 HS 编码唯一性，保存到 products 表）
  - [x] 实现产品更新逻辑（不允许修改 HS 编码，更新 updated_at 和 updated_by）
  - [x] 实现产品删除逻辑（检查关联记录，软删除或硬删除）
  - [x] 实现产品查询逻辑（列表查询，支持过滤和分页，默认每页 20 条）

- [x] Task 2: 数据库集成 (AC: #3, #5, #6)
  - [x] 确认 products 表已创建（使用迁移脚本 001-create-products-table.sql）
  - [x] 实现数据库连接（使用 `pg.Pool`，参考 HealthService 或 RestoreService 的实现）
  - [x] 实现 workspace_id 获取方法（使用 TwentyClientService 查询 currentUser.workspaceMember.workspace.id）
  - [x] 实现产品创建 SQL（INSERT INTO products，包含 workspace_id）
  - [x] 实现产品更新 SQL（UPDATE products）
  - [x] 实现产品软删除 SQL（UPDATE products SET status = 'inactive', deleted_at = NOW()）
  - [x] 实现产品硬删除 SQL（DELETE FROM products WHERE id = $1 AND 无关联记录）
  - [x] 实现关联记录检查（查询 product_customer_interactions 表，检查 product_id 匹配且 deleted_at IS NULL 的记录）

- [x] Task 3: 产品验证逻辑 (AC: #4)
  - [x] 实现产品名称验证（必填，长度限制：1-255 字符）
  - [x] 实现 HS 编码验证（必填，格式验证：`/^[0-9]{6,10}(-[0-9]{2,4})*$/`，唯一性检查：查询 `idx_products_workspace_hs_code`）
  - [x] 实现产品类别验证（从可维护的类别列表中选择，查询数据库验证类别存在性）
  - [x] 实现产品描述验证（可选，长度限制：最大 5000 字符）
  - [x] 实现产品规格验证（JSONB 格式验证，确保是有效的 JSON 对象）
  - [x] Task 3.1: 类别-HS编码双向联动 (AC: #2)
    - [x] 实现选择类别自动填充HS编码功能
    - [x] 实现输入HS编码自动查找并填充类别功能（使用防抖优化）
    - [x] 添加同步状态反馈（加载提示）
  - [x] Task 3.2: 产品规格表格化UI (AC: #2)
    - [x] 创建 SpecificationsTable 组件（可复用）
    - [x] 实现动态添加/删除行功能
    - [x] 实现表格数据 ↔ JSON格式双向转换
    - [x] 实现重复属性名检测
    - [x] 实现空行自动清理（提交时）

- [x] Task 4: 前端产品管理页面 (AC: #1, #2)
  - [x] 创建产品管理页面组件 (ProductManagementPage.tsx)
  - [x] 创建产品列表组件 (ProductList.tsx)
  - [x] 实现产品列表显示（表格或卡片视图）
  - [x] 实现"创建新产品"按钮
  - [x] 实现产品列表分页
  - [x] 实现产品列表过滤（按状态、类别）

- [x] Task 5: 前端产品创建表单 (AC: #2, #3, #4)
  - [x] 创建产品创建表单组件 (ProductCreateForm.tsx)
  - [x] 实现必填字段：产品名称（1-255 字符）、HS编码（格式验证）、产品类别（从可维护的类别列表选择）
  - [x] 实现可选字段：产品描述（最大 5000 字符）、产品规格（表格形式输入）、产品图片（URL 输入）
  - [x] 实现产品类别下拉列表（从API获取类别列表，显示类别名称和HS编码）
  - [x] 实现表单验证（前端验证：使用 React Hook Form + Yup 或 Zod，后端验证：DTO validation）
  - [x] 实现错误消息显示（显示验证错误和 API 错误）
  - [x] 实现成功消息显示（创建成功后显示提示并刷新列表）
  - [x] Task 5.1: 类别-HS编码双向联动 (AC: #2)
    - [x] 实现选择类别自动填充HS编码（同步操作）
    - [x] 实现输入HS编码自动查找类别（异步操作，防抖500ms）
    - [x] 添加同步状态视觉反馈
  - [x] Task 5.2: 产品规格表格化 (AC: #2)
    - [x] 集成 SpecificationsTable 组件
    - [x] 实现规格数据与表单数据的双向绑定
    - [x] 更新验证逻辑（检查重复属性名）

- [x] Task 6: 前端产品编辑表单 (AC: #5)
  - [x] 创建产品编辑表单组件 (ProductEditForm.tsx)
  - [x] 实现表单预填充（从产品详情加载数据）
  - [x] 实现 HS 编码字段禁用（不允许修改）
  - [x] 实现产品更新 API 调用
  - [x] 实现成功消息显示

- [x] Task 7: 前端产品删除功能 (AC: #6)
  - [x] 实现删除确认对话框
  - [x] 实现删除 API 调用（检查关联记录）
  - [x] 实现软删除/硬删除处理
  - [x] 实现删除后列表刷新
  - [x] 实现成功消息显示

- [x] Task 8: 前端产品服务集成 (AC: #1, #3, #5, #6)
  - [x] 创建产品服务 (products.service.ts) - 前端 API 调用
  - [x] 实现产品列表查询 API 调用
  - [x] 实现产品创建 API 调用
  - [x] 实现产品更新 API 调用
  - [x] 实现产品删除 API 调用
  - [x] 实现产品详情查询 API 调用

- [x] Task 9: 审计日志集成 (AC: #3, #5, #6)
  - [x] 集成 AuditService（记录产品创建、更新、删除操作）
  - [x] 记录操作者信息
  - [x] 记录变更前后值（更新和删除操作）

## Dev Notes

- **Relevant architecture patterns and constraints:**
  - API Integration Architecture: Custom backend (`fenghua-backend`) and frontend (`fenghua-frontend`) interact with Twenty CRM via its GraphQL API.
  - Database: Use custom `products` table (not Twenty CRM Custom Objects) for data storage. Migration script: `fenghua-backend/migrations/001-create-products-table.sql`.
  - Soft Delete: Implement soft delete strategy (mark as `inactive`) to preserve historical interaction records.
  - HS Code Uniqueness: HS code must be unique within a workspace (not globally). Use unique index: `idx_products_workspace_hs_code`.
  - Audit Logging: Reuse existing `AuditService` from Story 1.4.

- **Source tree components to touch:**
  - `fenghua-backend/src/products/`: New module for product management.
  - `fenghua-backend/migrations/001-create-products-table.sql`: Database migration (already created, verify execution).
  - `fenghua-frontend/src/products/`: New module for product management UI.

- **Testing standards summary:**
  - Unit tests for `products.service.ts`, `products.controller.ts` (backend).
  - Unit tests for product components (frontend).
  - Integration tests for product CRUD endpoints.
  - E2E tests for product creation, editing, and deletion flows.

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Custom code in `fenghua-backend` and `fenghua-frontend`
- **Detected Conflicts or Variances:**
  - Database: Use custom `products` table instead of Twenty CRM Custom Objects API (as per architecture decision)
  - HS Code Validation: Format validation required (typically 6-10 digits, may include hyphens)
  - Product Categories: Predefined list (can be stored in database or configuration file)

### References

- **Epic Definition:** [epics.md#Story 2.1](_bmad-output/epics.md#story-21-产品创建和管理)
- **Architecture Data Model:** [architecture.md#Data Model](_bmad-output/architecture.md#data-model)
- **Database Schema:** [database-schema-design.md#产品表](docs/database-schema-design.md#1-产品表products)
- **Migration Script:** [001-create-products-table.sql](../fenghua-backend/migrations/001-create-products-table.sql)
- **API Integration Architecture:** [api-integration-architecture.md](docs/api-integration-architecture.md)
- **AuditService:** [audit.service.ts](../fenghua-backend/src/audit/audit.service.ts) - Reuse existing audit service

### Key Technical Details

- **Database Schema:**
  - Table: `products`
  - Primary Key: `id` (UUID)
  - Required Fields: `name`, `hs_code`, `workspace_id`
  - Optional Fields: `description`, `category`, `specifications` (JSONB), `image_url`
  - Status Field: `status` (active, inactive, archived) - default 'active'
  - Soft Delete: `deleted_at` (TIMESTAMP) - NULL means not deleted
  - Audit Fields: `created_at`, `updated_at`, `created_by`, `updated_by`
  - Workspace Isolation: `workspace_id` (UUID) - required for multi-tenant isolation
    - **获取方式：** 从 JWT token 中提取 workspace_id
    - **实现：** 使用 `TwentyClientService.executeQueryWithToken` 查询 `currentUser.workspaceMember.workspace.id`
    - **代码示例：**
      ```typescript
      async getWorkspaceId(token: string): Promise<string> {
        try {
          const query = `
            query {
              currentUser {
                workspaceMember {
                  workspace {
                    id
                  }
                }
              }
            }
          `;
          const result = await this.twentyClient.executeQueryWithToken<{
            currentUser: {
              workspaceMember: {
                workspace: {
                  id: string;
                };
              };
            };
          }>(query, token);

          return result.currentUser.workspaceMember.workspace.id;
        } catch (error) {
          this.logger.error('Failed to get workspace ID', error);
          throw new BadRequestException('Failed to get workspace ID');
        }
      }
      ```
    - **参考实现：** `BackupService.getWorkspaceId` (fenghua-backend/src/backup/backup.service.ts:79-107)
  - Unique Constraint: `(workspace_id, hs_code)` - HS code unique within workspace
  - Indexes: `idx_products_workspace_hs_code`, `idx_products_status`, `idx_products_category`, `idx_products_name_search` (full-text), `idx_products_workspace`, `idx_products_workspace_status`

- **HS Code Validation:**
  - Format: Typically 6-10 digits, may include hyphens (e.g., "123456", "1234-56-78")
  - Uniqueness: Must be unique within workspace (check `idx_products_workspace_hs_code`)
  - Validation Regex: `/^[0-9]{6,10}(-[0-9]{2,4})*$/` (adjust based on actual HS code format requirements)

- **Product Categories:**
  - **存储方式：** 存储在数据库表 `product_categories` 中（Story 2.8实现）
  - **类别管理：** 管理员可以通过类别管理页面创建、编辑、删除类别
  - **类别-HS编码绑定：** 每个类别绑定一个唯一的HS编码（一对一关系）
  - **验证：** 在 DTO 中查询数据库验证类别存在性
  - **双向联动：** 选择类别自动填充HS编码，输入HS编码自动查找类别

- **Product Specifications:**
  - Stored as JSONB in `specifications` field
  - Flexible structure: `{ "weight": "10kg", "dimensions": "20x30x40cm", "material": "steel" }`
  - Frontend provides table-based input (SpecificationsTable component)
  - Users can dynamically add/remove rows
  - Each row contains: property name (key) and property value
  - System validates for duplicate property names
  - Empty rows are automatically filtered out on submit

- **Soft Delete Strategy:**
  - **关联记录检查：**
    - **表名：** `product_customer_interactions`
    - **查询方法：** 检查是否存在 `product_id` 匹配的记录
    - **代码示例：**
      ```typescript
      async hasAssociatedInteractions(productId: string): Promise<boolean> {
        const result = await this.pgPool.query(
          'SELECT COUNT(*) as count FROM product_customer_interactions WHERE product_id = $1 AND deleted_at IS NULL',
          [productId]
        );
        return parseInt(result.rows[0].count) > 0;
      }
      ```
    - **注意：** 只检查未删除的互动记录（`deleted_at IS NULL`）
  - **删除逻辑：**
    - If associations exist: Set `status = 'inactive'`, `deleted_at = NOW()`
    - If no associations: Can perform hard delete (`DELETE FROM products WHERE id = $1`)
  - **查询过滤：** Soft-deleted products are filtered out by default in queries (`WHERE deleted_at IS NULL`)

- **Product Image:**
  - Store image URL in `image_url` field
  - Image upload functionality can be implemented in future story
  - For MVP: Allow manual URL input or use placeholder

- **Database Connection:**
  - **选择：** 使用 `pg` 库的 `Pool`（与现有服务一致，如 HealthService, RestoreService）
  - **实现：** 参考 `HealthService.initializeDatabaseConnection()` 或 `RestoreService.initializeDatabaseConnection()`
  - **代码示例：**
    ```typescript
    import { Pool } from 'pg';
    import { ConfigService } from '@nestjs/config';

    private pgPool: Pool | null = null;

    constructor(private readonly configService: ConfigService) {
      this.initializeDatabaseConnection();
    }

    private initializeDatabaseConnection(): void {
      const databaseUrl = this.configService.get<string>('DATABASE_URL') || 
                         this.configService.get<string>('PG_DATABASE_URL');
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
    }
    ```
  - **参考实现：** 
    - `HealthService` (fenghua-backend/src/monitoring/health.service.ts:52-70)
    - `RestoreService` (fenghua-backend/src/restore/restore.service.ts:45-62)
  - **连接字符串：** 从环境变量 `DATABASE_URL` 或 `PG_DATABASE_URL` 获取

- **Error Handling:**
  - HS Code duplicate: Return `409 Conflict` with message "HS编码已存在"
  - Product not found: Return `404 Not Found`
  - Validation errors: Return `400 Bad Request` with detailed error messages
  - Database errors: Log error, return `500 Internal Server Error`

- **Permission Verification:**
  - **使用 Guard：** `AdminGuard`（与 `JwtAuthGuard` 组合使用）
  - **实现：** 在 Controller 中使用 `@UseGuards(JwtAuthGuard, AdminGuard)`
  - **代码示例：**
    ```typescript
    @Controller('products')
    @UseGuards(JwtAuthGuard, AdminGuard)
    export class ProductsController {
      // ...
    }
    ```
  - **参考实现：** 
    - `BackupController` (fenghua-backend/src/backup/backup.controller.ts)
    - `RestoreController` (fenghua-backend/src/restore/restore.controller.ts)
    - `RolesController` (fenghua-backend/src/roles/roles.controller.ts:28)

- **Performance Considerations:**
  - Use pagination for product list (default: 20 items per page, limit: 20, offset: 0)
  - Use indexes for filtering and searching
  - Cache product categories (if stored in database)
  - Optimize queries with proper WHERE clauses and indexes

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI Assistant)

### Debug Log References

### Completion Notes List

- **2025-12-26**: Story 2.1 文件已创建，状态设置为 `ready-for-dev`
- **2025-12-26**: 根据验证报告应用了所有改进建议：
  - 添加了 workspace_id 获取方法（参考 BackupService.getWorkspaceId）
  - 明确了数据库连接方式（使用 pg.Pool，参考 HealthService/RestoreService）
  - 添加了产品类别预定义列表和验证方式（PRODUCT_CATEGORIES 常量）
  - 添加了关联记录检查的具体实现（hasAssociatedInteractions 方法）
  - 添加了权限验证（AdminGuard）使用说明和代码示例
- **2025-12-26**: Story 2.1 实施完成，所有任务已标记为完成：
  - 后端：创建了 ProductsModule、ProductsService、ProductsController 和所有 DTOs
  - 数据库：实现了数据库连接、workspace_id 获取、所有 SQL 操作
  - 验证：实现了所有产品验证逻辑（DTO 验证）
  - 前端：创建了产品管理页面、列表组件、创建表单、编辑表单
  - 审计：集成了 AuditService，记录所有产品操作
  - 路由：在 App.tsx 中添加了产品管理路由
- **2025-12-29**: Story 2.1 需求更新（会议记录：meeting-notes-2025-12-29-product-management-enhancements.md）：
  - 添加类别-HS编码双向联动功能（依赖Story 2.8）
  - 添加产品规格表格化UI（SpecificationsTable组件）
  - 更新类别选择逻辑（从硬编码改为动态查询数据库）
  - 状态更新为 `in-progress`（需要完成新功能）

### File List

**Backend Files (created):**
- `fenghua-backend/src/products/products.module.ts`
- `fenghua-backend/src/products/products.service.ts`
- `fenghua-backend/src/products/products.controller.ts`
- `fenghua-backend/src/products/dto/create-product.dto.ts`
- `fenghua-backend/src/products/dto/update-product.dto.ts`
- `fenghua-backend/src/products/dto/product-response.dto.ts`
- `fenghua-backend/src/products/dto/product-query.dto.ts`
- `fenghua-backend/src/products/products.service.spec.ts` (代码审查后添加)
- `fenghua-backend/src/products/products.controller.spec.ts` (代码审查后添加)
- `fenghua-backend/src/app.module.ts` (UPDATED - 添加 ProductsModule)

**Frontend Files (created):**
- `fenghua-frontend/src/products/ProductManagementPage.tsx`
- `fenghua-frontend/src/products/ProductManagementPage.css`
- `fenghua-frontend/src/products/components/ProductList.tsx`
- `fenghua-frontend/src/products/components/ProductList.css`
- `fenghua-frontend/src/products/components/ProductCreateForm.tsx`
- `fenghua-frontend/src/products/components/ProductCreateForm.css`
- `fenghua-frontend/src/products/components/ProductEditForm.tsx`
- `fenghua-frontend/src/products/components/ProductEditForm.css`
- `fenghua-frontend/src/products/products.service.ts`
- `fenghua-frontend/src/App.tsx` (UPDATED - 添加产品管理路由)

