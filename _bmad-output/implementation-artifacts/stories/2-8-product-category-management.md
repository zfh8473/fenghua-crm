# Story 2.8: 产品类别管理

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **系统管理员**,
I want **创建、编辑和删除产品类别，并维护类别与HS编码的映射关系**,
So that **我可以灵活管理产品类别，系统能够自动关联类别和HS编码，提升产品创建效率**.

## Acceptance Criteria

1. **Given** 管理员已登录系统
   **When** 管理员访问产品管理页面
   **Then** 系统显示"类别管理"入口（按钮或标签页）
   **And** 管理员可以点击进入类别管理页面

2. **Given** 管理员进入类别管理页面
   **When** 系统显示类别列表
   **Then** 列表显示所有产品类别（名称、HS编码、描述、使用统计）
   **And** 每个类别显示使用该类别的产品数量
   **And** 管理员可以点击"创建新类别"按钮

3. **Given** 管理员点击"创建新类别"
   **When** 系统显示类别创建表单
   **Then** 表单包含必填字段：类别名称、HS编码
   **And** 表单包含可选字段：类别描述
   **And** 系统验证类别名称和HS编码的唯一性
   **And** 系统验证HS编码格式（`/^[0-9]{6,10}(-[0-9]{2,4})*$/`）

4. **Given** 管理员填写类别创建表单
   **When** 管理员提交表单，所有必填字段已填写且格式正确
   **Then** 系统创建类别并保存到数据库
   **And** 系统显示成功消息"类别创建成功"
   **And** 新类别出现在类别列表中

5. **Given** 管理员填写类别创建表单
   **When** 管理员提交表单，但类别名称或HS编码已存在
   **Then** 系统显示错误消息"类别名称已存在"或"HS编码已存在"
   **And** 类别不被创建
   **And** 表单保持填写状态，允许管理员修正错误

6. **Given** 类别已存在
   **When** 管理员在类别列表中选择类别并点击"编辑"
   **Then** 系统显示类别编辑表单，预填充现有类别信息
   **And** 管理员可以修改类别名称、HS编码、描述
   **And** 系统验证修改后的名称和HS编码唯一性（排除当前类别）
   **And** 管理员提交修改后，系统更新类别信息并显示成功消息

7. **Given** 类别已存在且未被任何产品使用
   **When** 管理员尝试删除类别
   **Then** 系统显示确认对话框"确定要删除类别 [类别名称] 吗？"
   **And** 管理员确认后，系统执行软删除（标记 deleted_at）
   **And** 类别从类别列表中移除
   **And** 系统显示成功消息"类别删除成功"

8. **Given** 类别已存在且被产品使用
   **When** 管理员尝试删除类别
   **Then** 系统显示错误提示"该类别正在被 X 个产品使用，无法删除"
   **And** 系统显示使用该类别的产品列表（可选）
   **And** 删除操作被阻止
   **And** 系统提示"请先删除或修改使用该类别的产品"

9. **Given** 类别管理功能已实现
   **When** 管理员在产品创建表单中选择类别
   **Then** 系统自动填充对应的HS编码
   **And** 当管理员输入HS编码时，系统自动查找并填充对应的类别（如果存在）

10. **Given** 类别列表已加载
    **When** 系统显示类别列表
    **Then** 每个类别显示使用统计（"X 个产品使用"或"未使用"）
    **And** 使用统计实时更新（反映当前使用该类别的产品数量）

## Tasks / Subtasks

- [ ] Task 1: 数据库设计和迁移 (AC: #3, #4, #5, #6, #7, #8)
  - [ ] 创建迁移脚本 `009-create-product-categories-table.sql`
  - [ ] 创建数据迁移脚本 `010-seed-product-categories.sql`（导入现有硬编码类别）
  - [ ] 实现类别表结构：id, name, hs_code, description, 审计字段
  - [ ] 实现唯一约束：name, hs_code
  - [ ] 实现软删除支持（deleted_at）
  - [ ] 实现索引优化（name, hs_code查询）

- [ ] Task 2: 后端类别服务 (AC: #3, #4, #5, #6, #7, #8, #10)
  - [ ] 创建 ProductCategoriesModule
  - [ ] 创建 ProductCategoriesService（管理类别CRUD操作）
  - [ ] 创建 ProductCategoriesController（提供类别管理端点）
  - [ ] 实现类别数据模型（DTOs: CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto）
  - [ ] 实现类别创建逻辑（验证名称和HS编码唯一性，验证HS编码格式）
  - [ ] 实现类别更新逻辑（验证唯一性，排除当前类别）
  - [ ] 实现类别删除逻辑（检查使用情况，软删除）
  - [ ] 实现类别查询逻辑（列表查询，支持软删除过滤）
  - [ ] 实现使用统计查询（LEFT JOIN products表，统计使用数量）
  - [ ] 实现根据HS编码查找类别方法（用于产品创建表单）

- [ ] Task 3: 类别验证逻辑 (AC: #3, #4, #5, #6)
  - [ ] 实现类别名称验证（必填，长度限制：1-255字符，唯一性检查）
  - [ ] 实现HS编码验证（必填，格式验证：`/^[0-9]{6,10}(-[0-9]{2,4})*$/`，唯一性检查）
  - [ ] 实现类别描述验证（可选，长度限制：最大1000字符）
  - [ ] 实现使用情况检查（查询products表，统计使用该类别的产品数量）

- [ ] Task 4: 前端类别管理页面 (AC: #1, #2, #10)
  - [ ] 创建类别管理页面组件 (ProductCategoryManagementPage.tsx)
  - [ ] 创建类别列表组件 (CategoryList.tsx)
  - [ ] 实现类别列表显示（表格形式，显示名称、HS编码、描述、使用统计）
  - [ ] 实现使用统计显示（"X 个产品使用"或"未使用"）
  - [ ] 实现"创建新类别"按钮
  - [ ] 实现类别管理入口（在产品管理页面添加入口）

- [ ] Task 5: 前端类别创建表单 (AC: #3, #4, #5)
  - [ ] 创建类别创建表单组件 (CategoryCreateForm.tsx)
  - [ ] 实现必填字段：类别名称（1-255字符）、HS编码（格式验证）
  - [ ] 实现可选字段：类别描述（最大1000字符）
  - [ ] 实现表单验证（前端验证 + 后端验证）
  - [ ] 实现错误消息显示（显示验证错误和API错误）
  - [ ] 实现成功消息显示（创建成功后显示提示并刷新列表）

- [ ] Task 6: 前端类别编辑表单 (AC: #6)
  - [ ] 创建类别编辑表单组件 (CategoryEditForm.tsx)
  - [ ] 实现表单预填充（从类别详情加载数据）
  - [ ] 实现类别更新API调用
  - [ ] 实现唯一性验证（排除当前类别）
  - [ ] 实现成功消息显示

- [ ] Task 7: 前端类别删除功能 (AC: #7, #8)
  - [ ] 实现删除确认对话框
  - [ ] 实现使用情况检查（显示使用统计）
  - [ ] 实现删除API调用（检查使用情况，软删除）
  - [ ] 实现删除后列表刷新
  - [ ] 实现错误提示（类别被使用时阻止删除）

- [ ] Task 8: 前端类别服务集成 (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9)
  - [ ] 创建类别服务 (categories.service.ts) - 前端API调用
  - [ ] 实现类别列表查询API调用（包含使用统计）
  - [ ] 实现类别创建API调用
  - [ ] 实现类别更新API调用
  - [ ] 实现类别删除API调用
  - [ ] 实现根据HS编码查找类别API调用（用于产品创建表单）

- [ ] Task 9: 产品表单集成类别联动 (AC: #9)
  - [ ] 修改 ProductCreateForm（集成类别选择器）
  - [ ] 修改 ProductEditForm（集成类别选择器）
  - [ ] 实现选择类别自动填充HS编码（同步操作）
  - [ ] 实现输入HS编码自动查找类别（异步操作，防抖500ms）
  - [ ] 添加同步状态视觉反馈
  - [ ] 更新类别验证逻辑（从硬编码改为查询数据库）

- [ ] Task 10: 审计日志集成 (AC: #4, #6, #7)
  - [ ] 集成 AuditService（记录类别创建、更新、删除操作）
  - [ ] 记录操作者信息
  - [ ] 记录变更前后值（更新和删除操作）

## Dev Notes

- **Relevant architecture patterns and constraints:**
  - Database: Use custom `product_categories` table for data storage. Migration script: `fenghua-backend/migrations/009-create-product-categories-table.sql`.
  - Soft Delete: Implement soft delete strategy (mark `deleted_at`) to preserve historical data.
  - Category-HS Code Binding: One-to-one relationship (each category binds to one unique HS code).
  - Usage Statistics: Query products table to count how many products use each category.
  - Integration: Product creation/editing forms depend on category data (Story 2.1 integration).

- **Source tree components to touch:**
  - `fenghua-backend/src/product-categories/`: New module for category management.
  - `fenghua-backend/migrations/009-create-product-categories-table.sql`: Database migration.
  - `fenghua-backend/migrations/010-seed-product-categories.sql`: Data migration (import existing categories).
  - `fenghua-frontend/src/product-categories/`: New module for category management UI.
  - `fenghua-frontend/src/products/components/ProductCreateForm.tsx`: Update to use dynamic categories.
  - `fenghua-frontend/src/products/components/ProductEditForm.tsx`: Update to use dynamic categories.

- **Testing standards summary:**
  - Unit tests for `product-categories.service.ts`, `product-categories.controller.ts` (backend).
  - Unit tests for category components (frontend).
  - Integration tests for category CRUD endpoints.
  - E2E tests for category creation, editing, and deletion flows.
  - Integration tests for category-HS code bidirectional sync in product forms.

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Custom code in `fenghua-backend` and `fenghua-frontend`
- **Dependencies:**
  - Story 2.1: Product creation forms need category data
  - This story should be implemented before Story 2.2 (product search depends on category data)

### References

- **Epic Definition:** [epics.md#Epic 2](_bmad-output/epics.md#epic-2-产品管理)
- **Meeting Notes:** [meeting-notes-2025-12-29-product-management-enhancements.md](_bmad-output/meeting-notes-2025-12-29-product-management-enhancements.md)
- **Story 2.1:** [2-1-product-creation-and-management.md](2-1-product-creation-and-management.md) - Integration point

### Key Technical Details

- **Database Schema:**
  - Table: `product_categories`
  - Primary Key: `id` (UUID)
  - Required Fields: `name`, `hs_code`
  - Optional Fields: `description`
  - Unique Constraints: `name` (unique), `hs_code` (unique)
  - Soft Delete: `deleted_at` (TIMESTAMP) - NULL means not deleted
  - Audit Fields: `created_at`, `updated_at`, `created_by`, `updated_by`
  - Indexes: `idx_product_categories_name`, `idx_product_categories_hs_code`

- **HS Code Validation:**
  - Format: `/^[0-9]{6,10}(-[0-9]{2,4})*$/`
  - Uniqueness: Must be unique globally (not per workspace)
  - Binding: One category binds to one HS code (one-to-one relationship)

- **Category Usage Check:**
  - Query: `SELECT COUNT(*) FROM products WHERE category = $1 AND deleted_at IS NULL`
  - If count > 0: Prevent deletion, show usage statistics
  - If count = 0: Allow soft delete

- **Bidirectional Sync:**
  - Category → HS Code: Synchronous (immediate update)
  - HS Code → Category: Asynchronous (debounced API call, 500ms)
  - Visual feedback: Show loading state during sync

- **Data Migration:**
  - Import existing 6 hardcoded categories:
    - 电子产品 → HS编码待定
    - 机械设备 → HS编码待定
    - 化工产品 → HS编码待定
    - 纺织品 → HS编码待定
    - 食品 → HS编码待定
    - 其他 → HS编码待定
  - Note: HS编码需要业务确认后填入

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI Assistant)

### Completion Notes List

- **2025-12-29**: Story 2.8 文件已创建，状态设置为 `ready-for-dev`
- **2025-12-29**: 基于会议讨论创建（meeting-notes-2025-12-29-product-management-enhancements.md）
- **优先级：** 高（应在Story 2.2之前实现，因为搜索功能依赖类别数据）

### File List

**Backend Files (to be created):**
- `fenghua-backend/src/product-categories/product-categories.module.ts`
- `fenghua-backend/src/product-categories/product-categories.service.ts`
- `fenghua-backend/src/product-categories/product-categories.controller.ts`
- `fenghua-backend/src/product-categories/dto/create-category.dto.ts`
- `fenghua-backend/src/product-categories/dto/update-category.dto.ts`
- `fenghua-backend/src/product-categories/dto/category-response.dto.ts`
- `fenghua-backend/migrations/009-create-product-categories-table.sql`
- `fenghua-backend/migrations/010-seed-product-categories.sql`
- `fenghua-backend/src/app.module.ts` (UPDATED - 添加 ProductCategoriesModule)

**Frontend Files (to be created):**
- `fenghua-frontend/src/product-categories/ProductCategoryManagementPage.tsx`
- `fenghua-frontend/src/product-categories/categories.service.ts`
- `fenghua-frontend/src/product-categories/components/CategoryList.tsx`
- `fenghua-frontend/src/product-categories/components/CategoryForm.tsx`
- `fenghua-frontend/src/App.tsx` (UPDATED - 添加类别管理路由)

**Files to be updated:**
- `fenghua-frontend/src/products/components/ProductCreateForm.tsx` - 集成类别联动
- `fenghua-frontend/src/products/components/ProductEditForm.tsx` - 集成类别联动
- `fenghua-backend/src/products/products.service.ts` - 验证类别存在性
- `fenghua-backend/src/products/dto/create-product.dto.ts` - 更新类别验证逻辑

