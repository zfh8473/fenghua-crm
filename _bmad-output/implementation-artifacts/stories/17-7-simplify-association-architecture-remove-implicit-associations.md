# Story 17.7: 简化关联架构 - 移除隐式关联概念

Status: ready-for-review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **开发团队**,
I want **简化产品-客户关联架构，移除隐式关联概念**,
So that **系统架构更简单，用户体验更清晰，关联管理更统一**.

## Background

经过团队讨论（2025-01-03 Party Mode 会议），决定简化关联架构：

**业务规则澄清：**
1. 互动的对象一定是客户（必须先选择客户）
2. 互动的内容一定是针对某一类或某几类产品（只能选择该客户已关联的产品）
3. 创建互动的前提：产品和客户之间必须已有关联
4. 创建互动时可以选择多个产品

**架构简化决策：**
- 移除"隐式关联"概念（通过互动记录自动产生的关联）
- 关联只能通过产品管理界面或客户管理界面手动创建
- 创建互动时，产品选择限制为该客户已关联的产品
- 简化查询逻辑：只查询 `product_customer_associations` 表，移除 UNION 查询

## Acceptance Criteria

1. **Given** 系统需要简化关联查询逻辑
   **When** 开发团队更新 `getProductAssociations` 和 `getCustomerAssociations` 方法
   **Then** 移除 UNION 查询逻辑
   **And** 只查询 `product_customer_associations` 表
   **And** 移除 `hasExplicitAssociation` 字段（因为所有关联都是明确的）
   **And** 移除状态标记逻辑（"有互动记录"vs"待互动"）
   **And** 保留互动数量统计（通过 LEFT JOIN `product_customer_interactions` 表）

2. **Given** 系统需要移除自动创建关联逻辑
   **When** 开发团队更新 `InteractionsService.create` 方法
   **Then** 移除自动创建关联的代码（Story 17.6 中实现的逻辑）
   **And** 移除 `createAssociationInTransaction` 方法的调用
   **And** 移除关联类型自动设置的逻辑
   **And** 保留互动记录创建的核心逻辑

3. **Given** 前端需要限制产品选择为已关联的产品
   **When** 开发团队更新 `InteractionCreateForm` 组件
   **Then** 选择客户后，调用 `GET /api/customers/:id/associations` 获取该客户已关联的产品列表
   **And** 产品选择器只显示已关联的产品（支持多选）
   **And** 如果客户没有关联任何产品，显示提示："该客户尚未关联任何产品，请先在产品管理或客户管理界面创建关联"
   **And** 提供快捷操作："创建关联"按钮，跳转到关联管理界面

4. **Given** 创建互动时需要支持多产品选择
   **When** 开发团队更新互动创建逻辑
   **Then** 前端支持选择多个产品（多选下拉或复选框）
   **And** 后端支持接收多个产品 ID（`productIds: string[]`）
   **And** 为每个产品创建一条互动记录（如果选择了 3 个产品，创建 3 条互动记录）
   **And** 所有互动记录共享相同的客户、互动类型、互动时间、描述等信息

5. **Given** 系统需要更新 DTO 和类型定义
   **When** 开发团队更新相关类型
   **Then** 移除 `ProductCustomerAssociationResponseDto` 中的 `hasExplicitAssociation` 字段
   **And** 移除 `CustomerProductAssociationResponseDto` 中的 `hasExplicitAssociation` 字段
   **And** 更新前端类型定义以匹配后端变更

6. **Given** 系统需要更新文档和注释
   **When** 开发团队更新代码注释
   **Then** 更新 `ProductCustomerAssociationManagementService` 的 JSDoc 注释
   **And** 移除关于"隐式关联"和"显式关联"的说明
   **And** 更新 `InteractionsService` 的注释，说明关联必须预先创建
   **And** 更新 Story 17.6 的状态为 `deprecated` 或 `superseded`

## Tasks / Subtasks

- [x] Task 1: 简化后端关联查询逻辑 (AC: #1)
  - [x] 更新 `ProductCustomerAssociationManagementService.getProductAssociations` 方法：
    - [x] 移除 UNION 查询逻辑
    - [x] 只查询 `product_customer_associations` 表
    - [x] 使用 LEFT JOIN `product_customer_interactions` 表统计互动数量
    - [x] 移除 `hasExplicitAssociation` 字段的计算
    - [ ] **简化后的查询结构：**
      ```sql
      SELECT 
        c.id,
        c.name,
        c.customer_type,
        pca.association_type,
        pca.created_by,
        COUNT(DISTINCT pci.id) as interaction_count
      FROM product_customer_associations pca
      INNER JOIN companies c ON c.id = pca.customer_id
      LEFT JOIN product_customer_interactions pci 
        ON pci.product_id = pca.product_id 
        AND pci.customer_id = pca.customer_id 
        AND pci.deleted_at IS NULL
      WHERE pca.product_id = $1 
        AND pca.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($2::text IS NULL OR c.customer_type = $2)
      GROUP BY c.id, c.name, c.customer_type, pca.association_type, pca.created_by
      ORDER BY interaction_count DESC, c.name ASC
      LIMIT $3 OFFSET $4
      ```
    - [x] 性能优化：单表查询 + LEFT JOIN 比 UNION 查询更高效，预计性能提升 30-50%
  - [x] 更新 `ProductCustomerAssociationManagementService.getCustomerAssociations` 方法：
    - [x] 移除 UNION 查询逻辑
    - [x] 只查询 `product_customer_associations` 表
    - [x] 使用 LEFT JOIN `product_customer_interactions` 表统计互动数量
    - [x] 移除 `hasExplicitAssociation` 字段的计算
    - [ ] **简化后的查询结构（类似 getProductAssociations，但查询方向相反）：**
      ```sql
      SELECT 
        p.id,
        p.name,
        p.hs_code,
        pca.association_type,
        pca.created_by,
        COUNT(DISTINCT pci.id) as interaction_count
      FROM product_customer_associations pca
      INNER JOIN products p ON p.id = pca.product_id
      LEFT JOIN product_customer_interactions pci 
        ON pci.customer_id = pca.customer_id 
        AND pci.product_id = pca.product_id 
        AND pci.deleted_at IS NULL
      WHERE pca.customer_id = $1 
        AND pca.deleted_at IS NULL
        AND p.deleted_at IS NULL
      GROUP BY p.id, p.name, p.hs_code, pca.association_type, pca.created_by
      ORDER BY interaction_count DESC, p.name ASC
      LIMIT $3 OFFSET $4
      ```
    - [x] 性能优化：单表查询 + LEFT JOIN 比 UNION 查询更高效

- [x] Task 2: 移除自动创建关联逻辑 (AC: #2)
  - [x] 更新 `InteractionsService.create` 方法：
    - [x] 移除自动创建关联的代码（步骤 5，约第 214-252 行）
    - [x] 移除 `createAssociationInTransaction` 方法的调用
    - [x] 移除关联类型自动设置的逻辑
    - [x] 移除 `AssociationType` 的导入（如果不再需要）
    - [x] **添加关联验证：**
      - [x] 在创建互动记录前，检查 `product_customer_associations` 表中是否存在关联
      - [x] 查询：`SELECT id FROM product_customer_associations WHERE product_id = $1 AND customer_id = $2 AND deleted_at IS NULL`
      - [x] 如果关联不存在，抛出 `BadRequestException('产品和客户之间必须已有关联，请先创建关联')`
      - [x] 验证应在事务开始后、创建互动记录前进行
    - [x] 保留互动记录创建的核心逻辑
  - [x] 更新 `InteractionsModule`：
    - [x] **当前状态：** `InteractionsModule` 已导入 `ProductsModule`（`ProductCustomerAssociationManagementService` 已从 `ProductsModule` 导出）
    - [x] **验证依赖：** 检查 `InteractionsService` 是否仍需要 `ProductCustomerAssociationManagementService`
    - [x] 已移除 `ProductCustomerAssociationManagementService` 的注入（不再需要）
    - [x] 保留 `ProductsModule` 导入（仍需要 `ProductsService` 来验证产品存在性）

- [x] Task 3: 更新前端互动创建表单 (AC: #3)
  - [x] 更新 `InteractionCreateForm` 组件：
    - [x] **使用现有组件：** 使用 `ProductMultiSelect` 组件（参考 `fenghua-frontend/src/products/components/ProductMultiSelect.tsx`）
    - [x] 选择客户后，调用 `GET /api/customers/:id/associations` 获取已关联的产品列表
    - [x] 将获取的产品列表传递给 `ProductMultiSelect` 组件（限制可选产品为已关联的产品）
    - [x] **空状态处理：**
      - [x] 如果客户没有关联任何产品，显示提示信息："该客户尚未关联任何产品，请先在产品管理或客户管理界面创建关联"
      - [x] 提供"创建关联"按钮，跳转到关联管理界面（`/customers/:customerId`）
      - [x] 禁用产品选择器，直到关联创建完成
    - [x] **多选功能：**
      - [x] `ProductMultiSelect` 组件已支持多选，直接使用即可
      - [x] 显示已选择的产品数量："已选择 X 个产品"
      - [x] 支持取消选择（点击已选产品的删除按钮）
  - [x] 更新产品选择器的 UI：
    - [x] 使用 `ProductMultiSelect` 组件（已存在，支持多选）
    - [x] 显示已选择的产品数量
    - [x] 支持取消选择

- [x] Task 4: 支持多产品互动记录创建 (AC: #4)
  - [x] 更新 `CreateInteractionDto`：
    - [x] **当前结构：** `productId: string` (单个产品，位于 `fenghua-backend/src/interactions/dto/create-interaction.dto.ts` 第 70-72 行)
    - [x] **新结构：** `productIds: string[]` (多个产品)
    - [x] 将 `productId: string` 改为 `productIds: string[]`
    - [x] 添加验证装饰器：
      - [x] `@IsArray({ message: '产品ID必须是数组' })`
      - [x] `@ArrayMinSize(1, { message: '至少选择一个产品' })`
      - [x] `@IsUUID('4', { each: true, message: '每个产品ID必须是有效的UUID' })`
    - [x] 更新 JSDoc 注释，说明支持多产品选择
  - [x] 更新 `InteractionsService.create` 方法：
    - [x] 接收 `productIds: string[]` 参数（替换原来的 `productId: string`）
    - [x] **事务处理：**
      - [x] 在单个事务中为所有产品创建互动记录
      - [x] 使用循环为每个产品创建一条互动记录
      - [x] 如果任何一条记录创建失败，回滚整个事务
      - [x] 确保所有互动记录原子性创建（要么全部成功，要么全部失败）
    - [x] **关联验证（在事务中）：**
      - [x] 为每个产品验证关联是否存在
      - [x] 如果任何产品没有关联，抛出 `BadRequestException` 并回滚事务
    - [x] 所有互动记录共享相同的客户、互动类型、互动时间、描述等信息
    - [x] **返回值：**
      - [x] 返回第一条记录的 ID（为了向后兼容，但会添加所有记录 ID 到响应中）
      - [x] 更新 `InteractionResponseDto` 类型（如果需要）
  - [x] 更新前端 `InteractionCreateForm`：
    - [x] 使用 `ProductMultiSelect` 组件支持选择多个产品
    - [x] 提交时发送 `productIds` 数组（替换原来的 `productId`）
    - [x] 更新表单验证逻辑，确保至少选择一个产品

- [x] Task 5: 更新 DTO 和类型定义 (AC: #5)
  - [x] 更新后端 `ProductCustomerAssociationResponseDto`：
    - [x] 文件：`fenghua-backend/src/products/dto/product-customer-association-management.dto.ts` (第 45-56 行)
    - [x] 移除 `hasExplicitAssociation: boolean` 字段（第 51 行）
    - [x] 保留其他字段（id, name, customerType, interactionCount, associationType, createdBy）
    - [x] 更新 JSDoc 注释，移除关于"显式关联"的说明
  - [x] 更新后端 `CustomerProductAssociationResponseDto`：
    - [x] 文件：`fenghua-backend/src/products/dto/product-customer-association-management.dto.ts` (第 62-73 行)
    - [x] 移除 `hasExplicitAssociation: boolean` 字段（第 68 行）
    - [x] 保留其他字段（id, name, hsCode, interactionCount, associationType, createdBy）
    - [x] 更新 JSDoc 注释，移除关于"显式关联"的说明
  - [x] 更新前端类型定义：
    - [x] 文件：`fenghua-frontend/src/products/types/product-customer-association-response.dto.ts` (第 20 行)
    - [x] 移除 `hasExplicitAssociation: boolean` 字段
    - [x] 文件：`fenghua-frontend/src/customers/types/customer-product-association-response.dto.ts` (第 20 行)
    - [x] 移除 `hasExplicitAssociation: boolean` 字段
    - [x] 更新相关组件的类型引用：
      - [x] `ProductCustomerAssociation.tsx`: 移除 `hasExplicitAssociation` 的引用
      - [x] `CustomerProductAssociation.tsx`: 移除 `hasExplicitAssociation` 的引用
      - [x] `ProductAssociationManagementModal.tsx`: 移除删除按钮的 `hasExplicitAssociation` 判断逻辑
      - [x] `CustomerAssociationManagementModal.tsx`: 移除删除按钮的 `hasExplicitAssociation` 判断逻辑

- [x] Task 6: 更新文档和注释 (AC: #6)
  - [x] 更新 `ProductCustomerAssociationManagementService` 的 JSDoc 注释：
    - [x] 文件：`fenghua-backend/src/products/product-customer-association-management.service.ts`
    - [x] 移除 `getProductAssociations` 方法注释中关于"隐式关联"和"显式关联"的说明
    - [x] 更新为：说明关联只能手动创建，查询只返回手动创建的关联
    - [x] 移除 `getCustomerAssociations` 方法注释中关于"隐式关联"的说明
    - [x] 更新为：说明关联只能手动创建，查询只返回手动创建的关联
  - [x] 更新 `InteractionsService` 的注释：
    - [x] 文件：`fenghua-backend/src/interactions/interactions.service.ts`
    - [x] 更新 `create` 方法的 JSDoc 注释：
      - [x] 移除关于"自动创建关联"的说明
      - [x] 添加：说明创建互动前必须已有关联
      - [x] 添加：说明支持多产品选择（`productIds: string[]`）
      - [x] 添加：说明为每个产品创建一条互动记录
  - [x] 更新 Story 17.6 的状态为 `deprecated` 或 `superseded`（已完成）
  - [x] 更新 Story 17.1 的注释，说明已简化查询逻辑（已完成）

- [ ] Task 7: 添加测试用例 (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 测试简化后的查询逻辑：
    - [ ] 测试 `getProductAssociations` 只返回手动创建的关联
    - [ ] 测试 `getCustomerAssociations` 只返回手动创建的关联
    - [ ] 验证互动数量统计正确
    - [ ] 验证不再返回 `hasExplicitAssociation` 字段
  - [ ] 测试移除自动创建关联后的互动创建流程：
    - [ ] 测试有关联时，可以正常创建互动
    - [ ] 测试无关联时，抛出 `BadRequestException`
    - [ ] 测试关联验证在事务中进行
  - [ ] 测试多产品选择功能：
    - [ ] 测试选择多个产品时，创建多条互动记录
    - [ ] 测试所有互动记录共享相同信息
    - [ ] 测试事务原子性（如果一条失败，全部回滚）
  - [ ] 测试前端组件更新：
    - [ ] 测试 `ProductCustomerAssociation` 组件移除 `hasExplicitAssociation` 后的显示
    - [ ] 测试 `CustomerProductAssociation` 组件移除 `hasExplicitAssociation` 后的显示
    - [ ] 测试 `InteractionCreateForm` 限制产品选择为已关联的产品
  - [ ] 回归测试：
    - [ ] 确保现有功能不受影响
    - [ ] 确保关联管理功能正常工作
    - [ ] 确保互动记录查询功能正常工作

## Implementation Notes

### 架构变更影响

**后端变更：**
- `ProductCustomerAssociationManagementService.getProductAssociations`: 简化查询，移除 UNION，改为单表查询 + LEFT JOIN
- `ProductCustomerAssociationManagementService.getCustomerAssociations`: 简化查询，移除 UNION，改为单表查询 + LEFT JOIN
- `InteractionsService.create`: 移除自动创建关联逻辑（步骤 5），添加关联验证，支持多产品（`productIds: string[]`）
- `CreateInteractionDto`: 将 `productId: string` 改为 `productIds: string[]`，支持多产品选择
- `ProductCustomerAssociationResponseDto`: 移除 `hasExplicitAssociation` 字段
- `CustomerProductAssociationResponseDto`: 移除 `hasExplicitAssociation` 字段

**前端变更：**
- `InteractionCreateForm`: 限制产品选择为已关联的产品，使用 `ProductMultiSelect` 组件支持多选
- `ProductCustomerAssociation`: 移除 `hasExplicitAssociation` 相关逻辑和状态判断
- `CustomerProductAssociation`: 移除 `hasExplicitAssociation` 相关逻辑和状态判断
- `ProductAssociationManagementModal`: 移除删除按钮的 `hasExplicitAssociation` 判断逻辑
- `CustomerAssociationManagementModal`: 移除删除按钮的 `hasExplicitAssociation` 判断逻辑
- 类型定义：更新 `ProductCustomerAssociationResponseDto` 和 `CustomerProductAssociationResponseDto`，移除 `hasExplicitAssociation` 字段

**数据库变更：**
- 无需数据库迁移（表结构不变）
- 查询逻辑简化：移除 UNION 查询，改为单表查询 + LEFT JOIN
- **性能影响：** 预计查询性能提升 30-50%（减少查询复杂度，索引使用更直接）

### 业务规则

1. **关联创建：** 只能通过产品管理界面或客户管理界面手动创建
2. **互动创建：** 必须选择已关联的产品（可以选择多个产品）
3. **关联查询：** 只返回手动创建的关联，不包含通过互动自动创建的关联

### 向后兼容性

- 现有数据不受影响（`product_customer_associations` 表结构不变）
- 前端需要更新以匹配新的 API 响应格式（移除 `hasExplicitAssociation` 字段）
- 后端 API 响应格式变更（移除 `hasExplicitAssociation` 字段），需要前端同步更新

### 迁移路径

**安全迁移步骤：**

1. **后端迁移（按顺序）：**
   - 先更新查询逻辑（Task 1）- 简化查询，但保留向后兼容的响应格式（临时保留 `hasExplicitAssociation: true`）
   - 再移除自动创建逻辑（Task 2）- 添加关联验证
   - 然后更新 DTO（Task 4）- 支持多产品，但保持单产品兼容（临时支持 `productId` 和 `productIds`）
   - 最后移除 `hasExplicitAssociation` 字段（Task 5）- 完全移除

2. **前端迁移（按顺序）：**
   - 先更新类型定义（Task 5）- 移除 `hasExplicitAssociation` 字段引用
   - 再更新组件逻辑（Task 3, Task 5）- 移除 `hasExplicitAssociation` 判断，更新产品选择逻辑
   - 最后更新表单（Task 4）- 支持多产品选择

3. **数据迁移：**
   - 无需数据迁移（表结构不变）
   - 现有数据兼容新逻辑（所有关联都是手动创建的）

**注意：** 如果采用渐进式迁移，需要在迁移期间同时支持新旧格式，迁移完成后移除旧格式支持。

## File List

**修改文件：**

**后端：**
- `fenghua-backend/src/interactions/interactions.service.ts` - 移除自动创建关联逻辑，添加关联验证，支持多产品（`productIds: string[]`），优化批量产品验证查询，完善审计日志
- `fenghua-backend/src/interactions/dto/create-interaction.dto.ts` - 将 `productId: string` 改为 `productIds: string[]`，添加数组验证装饰器
- `fenghua-backend/src/interactions/dto/interaction-response.dto.ts` - 添加 `createdInteractionIds?: string[]` 字段
- `fenghua-backend/src/products/product-customer-association-management.service.ts` - 简化查询逻辑（移除 UNION，只查询 `product_customer_associations` 表），移除 `hasExplicitAssociation` 字段，添加 `category` 字段到查询
- `fenghua-backend/src/products/dto/product-customer-association-management.dto.ts` - 移除 `hasExplicitAssociation` 字段
- `fenghua-backend/src/companies/dto/customer-product-association.dto.ts` - 添加 `category?: string` 字段
- `fenghua-backend/src/interactions/interactions.service.spec.ts` - 更新测试用例使用 `productIds: string[]`，更新 mock 以支持批量查询
- `fenghua-backend/src/interactions/interactions.controller.spec.ts` - 更新测试用例使用 `productIds: string[]`

**前端：**
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 使用 `ProductMultiSelect` 组件，限制产品选择为已关联的产品，支持多产品选择，修复附件关联逻辑（关联到所有创建的互动记录），修复 category 字段转换
- `fenghua-frontend/src/interactions/services/interactions.service.ts` - 更新 `Interaction` 接口，添加 `createdInteractionIds?: string[]` 字段
- `fenghua-frontend/src/products/components/ProductMultiSelect.tsx` - 添加 `allowedProducts?: Product[]` 属性，支持限制可选产品
- `fenghua-frontend/src/customers/types/customer-product-association-response.dto.ts` - 添加 `category?: string` 字段
- `fenghua-frontend/src/products/types/product-customer-association-response.dto.ts` - 移除 `hasExplicitAssociation` 字段引用（如果存在）
- `fenghua-frontend/src/customers/types/customer-product-association-response.dto.ts` - 移除 `hasExplicitAssociation` 字段引用（如果存在）
- `fenghua-frontend/src/products/components/ProductCustomerAssociation.tsx` - 移除 `hasExplicitAssociation` 相关逻辑
- `fenghua-frontend/src/customers/components/CustomerProductAssociation.tsx` - 移除 `hasExplicitAssociation` 相关逻辑
- `fenghua-frontend/src/products/components/ProductAssociationManagementModal.tsx` - 移除删除按钮的 `hasExplicitAssociation` 判断逻辑
- `fenghua-frontend/src/customers/components/CustomerAssociationManagementModal.tsx` - 移除删除按钮的 `hasExplicitAssociation` 判断逻辑

**文档：**
- `_bmad-output/implementation-artifacts/stories/17-6-association-and-interaction-integration.md` - 更新状态为 `deprecated`
- `_bmad-output/implementation-artifacts/stories/17-1-product-customer-association-data-model-and-api.md` - 更新查询逻辑说明

## Change Log

- **2025-01-03**: Story created via `create-story` workflow after Party Mode discussion.
- **2025-01-03**: Applied all validation improvements from `validate-create-story` workflow:
  - Added detailed SQL query examples
  - Added transaction handling specifications
  - Added component impact analysis
  - Added performance notes
  - Added migration path documentation
- **2025-01-03**: Implemented Story 17.7 via `dev-story` workflow:
  - ✅ Task 1: 简化后端关联查询逻辑（移除 UNION，只查询 `product_customer_associations` 表）
  - ✅ Task 2: 移除自动创建关联逻辑，添加关联验证
  - ✅ Task 3: 更新前端互动创建表单（限制产品选择为已关联的产品）
  - ✅ Task 4: 支持多产品互动记录创建（`productIds: string[]`）
  - ✅ Task 5: 更新 DTO 和类型定义（移除 `hasExplicitAssociation` 字段）
  - ✅ Task 6: 更新文档和注释
- **2025-01-03**: Code review completed - identified 8 issues (2 CRITICAL, 4 HIGH, 2 MEDIUM).
- **2025-01-03**: Fixed all CRITICAL and HIGH priority issues:
  - ✅ Critical #1: 更新 Story 文档任务完成状态
  - ✅ Critical #2: 修复附件关联逻辑（支持多产品场景）
  - ✅ High #3: 更新测试用例使用 `productIds`
  - ✅ High #4: 优化产品验证查询（解决 N+1 问题，使用批量查询）
  - ✅ High #5: 完善审计日志（记录所有创建的互动记录）
  - ✅ High #6: 修复 category 字段数据转换
- **2025-01-03**: Added File List and Change Log sections to Story document.

## References

- Story 17.1: 产品-客户关联数据模型和 API
- Story 17.6: 关联关系与互动记录的集成（已被此 Story 替代，状态：deprecated）
- Story 4.1: 互动记录创建（前端）
- Party Mode 讨论记录: 2025-01-03

