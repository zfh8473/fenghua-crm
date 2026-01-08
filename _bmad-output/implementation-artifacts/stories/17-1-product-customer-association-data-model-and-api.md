# Story 17.1: 产品-客户关联数据模型和 API（后端）

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **开发团队**,
I want **创建产品-客户关联的数据模型和 API**,
So that **系统可以存储和管理产品与客户之间的关联关系，支持"先关联后互动"的业务场景**.

## Acceptance Criteria

1. **Given** 数据库需要支持产品-客户关联
   **When** 开发团队创建数据库迁移脚本
   **Then** 创建 `product_customer_associations` 表，包含以下字段：
     - `id` (UUID, PRIMARY KEY)
     - `product_id` (UUID, NOT NULL, REFERENCES products(id) ON DELETE CASCADE)
     - `customer_id` (UUID, NOT NULL, REFERENCES companies(id) ON DELETE CASCADE)
     - `association_type` (VARCHAR(20), NOT NULL) - 'POTENTIAL_SUPPLIER' 或 'POTENTIAL_BUYER'
     - `created_by` (UUID)
     - `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
     - `updated_by` (UUID)
     - `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
     - `deleted_at` (TIMESTAMP WITH TIME ZONE, NULL)
   **And** 创建部分唯一索引：`CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL` 防止重复关联（参考 `idx_products_workspace_hs_code` 模式）
   **And** 注意：表结构不包含 `workspace_id` 字段（系统使用 `created_by` 进行多租户隔离，参考 Story 16.1 和迁移 `007-remove-workspace-dependencies.sql`）
   **And** 创建索引：`CREATE INDEX idx_product_customer_associations_product_id ON product_customer_associations(product_id) WHERE deleted_at IS NULL`
   **And** 创建索引：`CREATE INDEX idx_product_customer_associations_customer_id ON product_customer_associations(customer_id) WHERE deleted_at IS NULL`

2. **Given** 后端需要提供关联管理 API
   **When** 开发团队创建关联服务
   **Then** 创建 `ProductCustomerAssociationService`，实现以下方法：
     - `createAssociation(productId, customerId, associationType, token)` - 建立关联
     - `deleteAssociation(productId, customerId, token)` - 删除关联（软删除）
   - `getProductAssociations(productId, token, page, limit)` - 获取产品关联的客户列表（只返回手动创建的关联，统计互动数量）
     - **已简化：** 只查询 `product_customer_associations` 表，使用 LEFT JOIN 统计互动数量，不再使用 UNION 查询合并隐式关联
   - `getCustomerAssociations(customerId, token, page, limit)` - 获取客户关联的产品列表（只返回手动创建的关联，统计互动数量）
     - **已简化：** 只查询 `product_customer_associations` 表，使用 LEFT JOIN 统计互动数量，不再使用 UNION 查询合并隐式关联
   **And** 所有方法实现权限验证（使用 `PermissionService.getDataAccessFilter`）
   **And** 所有方法实现角色过滤（前端专员只能操作采购商，后端专员只能操作供应商）

3. **Given** 后端需要提供关联管理端点
   **When** 开发团队创建关联控制器
   **Then** 创建 `ProductCustomerAssociationManagementController`，提供以下端点：
     - `POST /api/products/:id/associations` - 建立产品与客户的关联
     - `DELETE /api/products/:id/associations/:customerId` - 删除产品与客户的关联
     - `POST /api/customers/:id/associations` - 建立客户与产品的关联
     - `DELETE /api/customers/:id/associations/:productId` - 删除客户与产品的关联
   **And** 所有端点使用 `@UseGuards(JwtAuthGuard)` 保护
   **And** 所有端点实现错误处理（400, 403, 404, 500）

4. **Given** 查询关联时需要返回手动创建的关联并统计互动数量
   **When** 开发团队实现查询逻辑
   **Then** `getProductAssociations` 方法只查询 `product_customer_associations` 表：
     - 查询 `product_customer_associations` 表获取手动创建的关联关系
     - 使用 LEFT JOIN `product_customer_interactions` 表统计互动数量
     - 返回结果包含：客户信息、关联类型、互动数量
   **Note:** 根据 Story 17.7，已移除 UNION 查询和隐式关联概念

5. **Given** 创建关联时需要验证数据
   **When** 开发团队实现创建关联逻辑
   **Then** 验证产品存在且未被删除
   **And** 验证客户存在且未被删除
   **And** 验证客户类型与用户角色匹配（前端专员只能关联采购商，后端专员只能关联供应商）
   **And** 验证关联类型与客户类型匹配（采购商使用 POTENTIAL_BUYER，供应商使用 POTENTIAL_SUPPLIER）
   **And** 验证关联关系不存在（防止重复关联）
   **And** 如果验证失败，返回相应的错误消息（400 Bad Request）

6. **Given** 删除关联时需要记录审计日志
   **When** 开发团队实现删除关联逻辑
   **Then** 执行软删除（设置 `deleted_at = NOW()`）
   **And** 记录 `updated_by` 和 `updated_at`
   **And** 记录审计日志（action: 'ASSOCIATION_DELETED'）
   **And** 不影响已有的互动记录

## Tasks / Subtasks

- [x] Task 1: 创建数据库迁移脚本 (AC: #1)
  - [x] 创建迁移文件 `fenghua-backend/migrations/015-create-product-customer-associations-table.sql`
  - [x] 定义表结构（id, product_id, customer_id, association_type, created_by, created_at, updated_by, updated_at, deleted_at）
  - [x] **重要：不包含 `workspace_id` 字段**（系统使用 `created_by` 进行多租户隔离，参考 Story 16.1 和迁移 `007-remove-workspace-dependencies.sql`）
  - [x] 创建外键约束（product_id → products(id) ON DELETE CASCADE, customer_id → companies(id) ON DELETE CASCADE）
  - [x] 创建部分唯一索引：`CREATE UNIQUE INDEX idx_product_customer_associations_unique ON product_customer_associations(product_id, customer_id) WHERE deleted_at IS NULL`（参考 `idx_products_workspace_hs_code` 模式）
  - [x] 创建索引（product_id, customer_id）优化查询性能（使用 `WHERE deleted_at IS NULL` 条件）
  - [x] 创建触发器自动更新 `updated_at` 时间戳（参考 `001-create-products-table.sql` 的触发器模式）
  - [x] 添加 CHECK 约束验证 association_type 值（'POTENTIAL_SUPPLIER' 或 'POTENTIAL_BUYER'）

- [x] Task 2: 创建 DTOs 和枚举 (AC: #2, #3, #4, #5)
  - [x] 创建关联类型枚举：`fenghua-backend/src/products/constants/association-types.ts`
    - [x] 定义枚举：`export enum AssociationType { POTENTIAL_SUPPLIER = 'POTENTIAL_SUPPLIER', POTENTIAL_BUYER = 'POTENTIAL_BUYER' }`
  - [x] 创建 `CreateProductCustomerAssociationDto` - 建立关联的 DTO
    - [x] 包含字段：`customerId` (UUID, required), `associationType` (AssociationType enum, required)
    - [x] 添加验证装饰器（@IsUUID('4'), @IsEnum(AssociationType)）
  - [x] 创建 `CreateCustomerProductAssociationDto` - 建立客户-产品关联的 DTO
    - [x] 包含字段：`productId` (UUID, required), `associationType` (AssociationType enum, required)
    - [x] 添加验证装饰器（@IsUUID('4'), @IsEnum(AssociationType)）
  - [x] 创建 `ProductCustomerAssociationResponseDto` - 查询响应的 DTO
    - [x] 扩展现有的 `ProductCustomerAssociationDto`（参考 `fenghua-backend/src/products/dto/product-customer-association.dto.ts`）
    - [x] 添加字段：`associationType?: AssociationType`（显式关联类型，如果来自 `product_customer_associations` 表）
    - [x] 添加字段：`hasExplicitAssociation: boolean`（是否有显式关联）
    - [x] 保留现有字段：`id`, `name`, `customerType`, `interactionCount`
  - [x] 创建 `CustomerProductAssociationResponseDto` - 客户-产品关联响应的 DTO
    - [x] 扩展现有的 `CustomerProductAssociationDto`（参考 `fenghua-backend/src/companies/dto/customer-product-association.dto.ts`）
    - [x] 添加字段：`associationType?: AssociationType`（显式关联类型）
    - [x] 添加字段：`hasExplicitAssociation: boolean`（是否有显式关联）
    - [x] 保留现有字段：`id`, `name`, `hsCode`, `interactionCount`

- [x] Task 3: 创建关联管理服务 (AC: #2, #4, #5, #6)
  - [x] 创建 `ProductCustomerAssociationManagementService`
    - [x] 注入 `ConfigService`, `AuthService`, `PermissionService`, `AuditService`, `ProductsService`, `CompaniesService`（参考 `InteractionsService` 的构造函数模式）
    - [x] 初始化 PostgreSQL 连接池（参考 `ProductCustomerAssociationService` 的实现）
    - [x] 实现 `createAssociation` 方法
      - [x] 验证用户 token 和权限
      - [x] 验证产品存在且未被删除
      - [x] 验证客户存在且未被删除
      - [x] 验证客户类型与用户角色匹配
      - [x] 验证关联类型与客户类型匹配
      - [x] 验证关联关系不存在（防止重复）
      - [x] 使用数据库事务确保数据一致性
      - [x] 记录 `created_by` 和 `created_at`
      - [x] 记录审计日志（action: 'ASSOCIATION_CREATED'）使用异步模式：`setImmediate(async () => { await this.auditService.log(...) })`（参考 `InteractionsService.create` 第 200 行的实现，避免阻塞主请求）
    - [x] 实现 `deleteAssociation` 方法
      - [x] 验证用户 token 和权限
      - [x] 验证关联关系存在且未被删除
      - [x] 验证用户是创建者（可选，根据业务需求）- 已注释，可根据业务需求启用
      - [x] 执行软删除（设置 `deleted_at = NOW()`）
      - [x] 记录 `updated_by` 和 `updated_at`
      - [x] 记录审计日志（action: 'ASSOCIATION_DELETED'）使用异步模式：`setImmediate(async () => { await this.auditService.log(...) })`（参考 `InteractionsService.delete` 第 610 行的实现）
    - [x] 实现 `getProductAssociations` 方法
      - [x] 使用 UNION 查询合并 `product_customer_associations` 和 `product_customer_interactions`（使用 CTE 和 UNION 进行去重）
      - [x] UNION 查询结构（使用 WITH 子句优化）：
        ```sql
        SELECT 
          c.id,
          c.name,
          c.customer_type,
          pca.association_type,
          COUNT(pci.id) as interaction_count,
          CASE WHEN pca.id IS NOT NULL THEN true ELSE false END as has_explicit_association
        FROM (
          -- 显式关联
          SELECT customer_id, association_type, id
          FROM product_customer_associations
          WHERE product_id = $1 AND deleted_at IS NULL
          UNION ALL
          -- 隐式关联（有互动记录）
          SELECT DISTINCT customer_id, NULL as association_type, NULL as id
          FROM product_customer_interactions
          WHERE product_id = $1 AND deleted_at IS NULL
        ) combined
        INNER JOIN companies c ON c.id = combined.customer_id
        LEFT JOIN product_customer_associations pca ON pca.product_id = $1 AND pca.customer_id = c.id AND pca.deleted_at IS NULL
        LEFT JOIN product_customer_interactions pci ON pci.product_id = $1 AND pci.customer_id = c.id AND pci.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
          AND ($2::text IS NULL OR c.customer_type = $2)
        GROUP BY c.id, c.name, c.customer_type, pca.association_type, pca.id
        ORDER BY interaction_count DESC
        LIMIT $3 OFFSET $4
        ```
      - [x] 实现去重逻辑（同一个客户只显示一次，使用 UNION 自动去重）
      - [x] 标记每个关联是否有显式关联（`hasExplicitAssociation` 字段）
      - [x] 实现分页支持
      - [x] 实现角色过滤（使用 `PermissionService.getDataAccessFilter`）
      - [x] 返回客户信息、关联类型、是否有显式关联、互动数量
    - [x] 实现 `getCustomerAssociations` 方法
      - [x] 使用 UNION 查询合并关联关系和互动记录（使用 CTE 和 UNION 进行去重）
      - [x] 类似的 UNION 查询结构（参考 `getProductAssociations` 的实现，但查询方向相反：从客户到产品）
      - [x] 实现去重逻辑（同一个产品只显示一次，使用 UNION 自动去重）
      - [x] 标记每个关联是否有显式关联（`hasExplicitAssociation` 字段）
      - [x] 实现分页支持
      - [x] 实现角色过滤
      - [x] 返回产品信息、关联类型、是否有显式关联、互动数量
    - [x] 实现 `createCustomerProductAssociation` 方法（复用 `createAssociation`）
    - [x] 实现 `deleteCustomerProductAssociation` 方法（复用 `deleteAssociation`）

- [x] Task 4: 创建关联管理控制器 (AC: #3)
  - [x] 创建 `ProductCustomerAssociationManagementController`
    - [x] 使用 `@Controller('products')` 装饰器
    - [x] 使用 `@UseGuards(JwtAuthGuard)` 保护所有端点
    - [x] 实现 `POST /api/products/:id/associations` 端点
      - [x] 使用 `@Param('id', ParseUUIDPipe)` 验证产品 ID
      - [x] 使用 `@Body(ValidationPipe)` 验证 DTO
      - [x] 使用 `@Token()` 获取 JWT token
      - [x] 调用 `ProductCustomerAssociationManagementService.createAssociation`
      - [x] 实现错误处理（400, 403, 404, 500）
    - [x] 实现 `DELETE /api/products/:id/associations/:customerId` 端点
      - [x] 使用 `@Param` 验证 ID
      - [x] 使用 `@Token()` 获取 JWT token
      - [x] 调用 `ProductCustomerAssociationManagementService.deleteAssociation`
      - [x] 返回 204 No Content
    - [x] 实现 `GET /api/products/:id/associations` 端点（查询产品关联的客户列表）
      - [x] 使用 `@Param('id', ParseUUIDPipe)` 验证产品 ID
      - [x] 使用 `@Query` 获取分页参数
      - [x] 使用 `@Token()` 获取 JWT token
      - [x] 调用 `ProductCustomerAssociationManagementService.getProductAssociations`
      - [x] 实现错误处理
    - [x] 创建 `CustomerProductAssociationManagementController`
      - [x] 使用 `@Controller('customers')` 装饰器
      - [x] 使用 `@UseGuards(JwtAuthGuard)` 保护所有端点
    - [x] 实现 `POST /api/customers/:id/associations` 端点
      - [x] 使用 `@Param('id', ParseUUIDPipe)` 验证客户 ID
      - [x] 使用 `@Body(ValidationPipe)` 验证 DTO
      - [x] 使用 `@Token()` 获取 JWT token
      - [x] 调用 `ProductCustomerAssociationManagementService.createCustomerProductAssociation`
      - [x] 实现错误处理（400, 403, 404, 500）
    - [x] 实现 `DELETE /api/customers/:id/associations/:productId` 端点
      - [x] 使用 `@Param` 验证 ID
      - [x] 使用 `@Token()` 获取 JWT token
      - [x] 调用 `ProductCustomerAssociationManagementService.deleteCustomerProductAssociation`
      - [x] 返回 204 No Content
    - [x] 实现 `GET /api/customers/:id/associations` 端点（查询客户关联的产品列表）
      - [x] 使用 `@Param('id', ParseUUIDPipe)` 验证客户 ID
      - [x] 使用 `@Query` 获取分页参数
      - [x] 使用 `@Token()` 获取 JWT token
      - [x] 调用 `ProductCustomerAssociationManagementService.getCustomerAssociations`
      - [x] 实现错误处理

- [x] Task 5: 注册模块和依赖 (AC: #2, #3)
  - [x] 创建 `ProductCustomerAssociationManagementModule`
    - [x] 导入 `ConfigModule`, `PermissionModule`, `AuditModule`, `AuthModule`, `ProductsModule`, `CompaniesModule`
    - [x] 提供 `ProductCustomerAssociationManagementService`
    - [x] 注册 `ProductCustomerAssociationManagementController` 和 `CustomerProductAssociationManagementController`
    - [x] 导出 `ProductCustomerAssociationManagementService`（供其他模块使用）
  - [x] 在 `ProductsModule` 中注册 `ProductCustomerAssociationManagementController` 和 `ProductCustomerAssociationManagementService`
  - [x] 在 `app.module.ts` 中注册 `ProductCustomerAssociationManagementModule`

- [ ] Task 6: 添加测试用例 (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 添加数据库迁移测试
    - [ ] 测试表结构创建
    - [ ] 测试索引创建
    - [ ] 测试约束创建
  - [ ] 添加 Service 测试
    - [ ] 测试 `createAssociation` 成功场景
    - [ ] 测试 `createAssociation` 验证失败场景（产品不存在、客户不存在、角色不匹配、重复关联）
    - [ ] 测试 `deleteAssociation` 成功场景
    - [ ] 测试 `deleteAssociation` 验证失败场景（关联不存在、权限不足）
    - [ ] 测试 `getProductAssociations` 查询逻辑（合并关联关系和互动记录）
    - [ ] 测试 `getCustomerAssociations` 查询逻辑
    - [ ] 测试权限验证和角色过滤
  - [ ] 添加 Controller 测试
    - [ ] 测试所有端点的成功场景
    - [ ] 测试错误处理（400, 403, 404, 500）
    - [ ] 测试 JWT 认证

## Dev Notes

### Architecture Compliance

**技术栈：**
- NestJS + TypeScript + PostgreSQL
- 使用 `pg.Pool` 进行数据库连接（参考 `ProductCustomerAssociationService` 的实现）
- 使用 `AuthService` 进行 token 验证（参考 `InteractionsService` 的构造函数）
- 使用 `PermissionService` 进行权限验证和角色过滤
- 使用 `AuditService` 记录审计日志（使用异步 `setImmediate` 模式，避免阻塞主请求）

**项目结构：**
- 服务文件：`fenghua-backend/src/products/product-customer-association-management.service.ts`
- 控制器文件：`fenghua-backend/src/products/product-customer-association-management.controller.ts`
- DTO 文件：`fenghua-backend/src/products/dto/product-customer-association-management.dto.ts`
- 模块文件：`fenghua-backend/src/products/product-customer-association-management.module.ts`
- 迁移文件：`fenghua-backend/migrations/015-create-product-customer-associations-table.sql`

**数据库模式：**
- 表名：`product_customer_associations`（snake_case）
- 字段命名：snake_case
- 使用 UUID 作为主键
- 实现软删除（deleted_at）
- 自动时间戳（created_at, updated_at）

**权限验证：**
- 使用 `PermissionService.getDataAccessFilter(token)` 获取用户数据访问过滤器
- 前端专员只能操作采购商（BUYER）
- 后端专员只能操作供应商（SUPPLIER）
- 总监/管理员可以操作所有客户类型

**关联类型：**
- `POTENTIAL_SUPPLIER`: 供应商可以供应该产品（后端专员视角）
- `POTENTIAL_BUYER`: 采购商潜在会购买此产品（前端专员视角）

**查询优化：**
- 使用 UNION ALL 查询合并关联关系和互动记录（比 UNION 更快，因为不需要去重）
- 如果确定没有重复数据，优先使用 UNION ALL；如果需要去重，使用 UNION
- 使用索引优化查询性能（product_id, customer_id，使用 `WHERE deleted_at IS NULL` 条件）
- 实现分页支持（默认每页 10 条，最大 100 条）
- 考虑查询性能：对于大数据集，可能需要优化 UNION 查询结构或使用物化视图

**错误处理：**
- 使用 NestJS 标准异常（BadRequestException, NotFoundException, ForbiddenException）
- 统一的错误响应格式
- 记录审计日志用于权限违规追踪

### Code Reuse and Integration Strategy

**与现有服务的集成：**
- **现有服务：** `ProductCustomerAssociationService` 和 `CustomerProductAssociationService` 已实现基于互动记录的关联查询
- **新服务职责：** `ProductCustomerAssociationManagementService` 专门处理显式关联关系的创建、删除和管理
- **查询集成：** `getProductAssociations` 和 `getCustomerAssociations` 方法需要合并显式关联（`product_customer_associations`）和隐式关联（`product_customer_interactions`）的查询结果
- **DTO 扩展：** 扩展现有的 `ProductCustomerAssociationDto` 和 `CustomerProductAssociationDto`，添加 `associationType` 和 `hasExplicitAssociation` 字段，而不是创建全新的 DTO
- **服务分离：** 保持现有查询服务不变，新服务专注于显式关联的 CRUD 操作，查询时合并两种关联类型

**参考 Story 2.4 和 Story 3.4 的实现：**
- `ProductCustomerAssociationService` 已实现查询产品关联客户的功能（基于互动记录）
- `CustomerProductAssociationService` 已实现查询客户关联产品的功能（基于互动记录）
- 这些服务使用 `product_customer_interactions` 表查询关联（隐式关联）
- 新服务需要支持显式关联（`product_customer_associations` 表），并在查询时合并两种关联类型

**参考 Story 4.2 的实现：**
- `InteractionsService` 使用数据库事务确保数据一致性
- 使用 `PermissionService.getDataAccessFilter` 进行权限验证
- 使用 `AuditService` 记录审计日志
- **关键模式：** 使用 `setImmediate(async () => { await this.auditService.log(...) })` 进行异步、非阻塞的审计日志记录（参考 `InteractionsService.create` 第 200 行）

**参考 Story 16.1 的实现：**
- 数据库迁移脚本的格式和结构
- 索引和约束的创建方式
- 触发器的实现方式
- **重要：** 表结构不包含 `workspace_id` 字段（系统使用 `created_by` 进行多租户隔离，参考迁移 `007-remove-workspace-dependencies.sql`）

### File Structure Requirements

**后端文件结构：**
```
fenghua-backend/
├── migrations/
│   └── 015-create-product-customer-associations-table.sql
├── src/
│   └── products/
│       ├── product-customer-association-management.service.ts
│       ├── product-customer-association-management.controller.ts
│       ├── product-customer-association-management.module.ts
│       └── dto/
│           └── product-customer-association-management.dto.ts
```

**命名约定：**
- 服务类：`ProductCustomerAssociationManagementService` (PascalCase)
- 控制器类：`ProductCustomerAssociationManagementController` (PascalCase)
- DTO 类：`CreateProductCustomerAssociationDto` (PascalCase with Dto suffix)
- 文件：`kebab-case.ts` (e.g., `product-customer-association-management.service.ts`)

### Testing Requirements

**测试文件位置：**
- Service 测试：`fenghua-backend/src/products/product-customer-association-management.service.spec.ts`
- Controller 测试：`fenghua-backend/src/products/product-customer-association-management.controller.spec.ts`

**测试覆盖：**
- 单元测试：测试服务方法的业务逻辑
- 集成测试：测试控制器端点与数据库交互
- 权限测试：测试角色过滤和权限验证
- 错误处理测试：测试各种错误场景

**Mock 依赖：**
- Mock `AuthService`（用于 token 验证）
- Mock `PermissionService`
- Mock `AuditService`
- Mock `ProductsService`
- Mock `CompaniesService`
- Mock PostgreSQL 连接池

### References

- Epic 17 定义：`_bmad-output/epics.md#epic-17`
- Story 17.1 详细说明：`_bmad-output/epics.md#story-17-1`
- 架构设计：`_bmad-output/architecture.md`
- 项目上下文：`_bmad-output/project-context.md`
- 现有关联服务参考：`fenghua-backend/src/products/product-customer-association.service.ts`
- 现有关联 DTO 参考：`fenghua-backend/src/products/dto/product-customer-association.dto.ts`
- 数据库迁移参考：`fenghua-backend/migrations/001-create-products-table.sql`（触发器模式）
- 数据库迁移参考：`fenghua-backend/migrations/007-remove-workspace-dependencies.sql`（workspace_id 移除模式）
- 权限服务参考：`fenghua-backend/src/permission/permission.service.ts`
- 审计服务参考：`fenghua-backend/src/audit/audit.service.ts`
- 异步审计日志模式参考：`fenghua-backend/src/interactions/interactions.service.ts`（第 200 行和第 610 行）
- AuthService 注入参考：`fenghua-backend/src/interactions/interactions.service.ts`（构造函数）

## Dev Agent Record

### Agent Model Used
Auto (Cursor AI Agent)

### Debug Log References
- 编译错误：修复了 `@IsUUID` 装饰器参数问题（需要使用 `@IsUUID('4', { message: '...' })` 格式）

### Completion Notes List
1. **数据库迁移脚本**：创建了 `015-create-product-customer-associations-table.sql`，包含表结构、外键约束、部分唯一索引、索引和触发器
2. **枚举定义**：创建了 `association-types.ts`，定义了 `AssociationType` 枚举
3. **DTOs**：创建了 `product-customer-association-management.dto.ts`，包含创建和响应 DTOs
4. **服务实现**：创建了 `ProductCustomerAssociationManagementService`，实现了所有 CRUD 操作和查询方法
5. **控制器实现**：创建了两个控制器：
   - `ProductCustomerAssociationManagementController`（处理 `/products/:id/associations` 端点）
   - `CustomerProductAssociationManagementController`（处理 `/customers/:id/associations` 端点）
6. **模块注册**：创建了 `ProductCustomerAssociationManagementModule`，并在 `app.module.ts` 中注册
7. **UNION 查询优化**：使用 CTE (WITH 子句) 和 UNION 优化了查询性能，实现了显式关联和隐式关联的合并

### File List
**创建的文件：**
- `fenghua-backend/migrations/015-create-product-customer-associations-table.sql`
- `fenghua-backend/src/products/constants/association-types.ts`
- `fenghua-backend/src/products/dto/product-customer-association-management.dto.ts`
- `fenghua-backend/src/products/dto/product-association-query.dto.ts` (新增：查询参数验证 DTO)
- `fenghua-backend/src/products/product-customer-association-management.service.ts`
- `fenghua-backend/src/products/product-customer-association-management.controller.ts`
- `fenghua-backend/src/products/product-customer-association-management.module.ts`
- `fenghua-backend/src/companies/customer-product-association-management.controller.ts`

**修改的文件：**
- `fenghua-backend/src/products/products.module.ts`（注册服务和控制器）
- `fenghua-backend/src/app.module.ts`（注册新模块）

### Code Review Fixes Applied
**审查日期：** 2025-01-03  
**修复的问题：**
1. ✅ 修复事务回滚问题（Issue #1）
2. ✅ 添加 UnauthorizedException 处理（Issue #2）
3. ✅ 修复 SQL 查询类型安全问题（Issue #3）
4. ✅ 添加查询参数验证 DTO（Issue #4）
5. ✅ 移除冗余索引（Issue #5）
6. ✅ 添加 JSDoc 注释（Issue #6）

详细审查报告：`_bmad-output/implementation-artifacts/stories/code-review-report-17-1-2025-01-03.md`

