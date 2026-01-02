# Story 3.4: 客户与产品关联查看（按角色）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **前端专员/后端专员/总监/管理员**,
I want **查看某个客户与哪些产品有关联**,
So that **我可以了解该客户的产品关系，分析客户的业务情况**.

## Acceptance Criteria

**AC1: 前端专员查看采购商关联的产品**
- **Given** 前端专员已登录系统
- **When** 前端专员在采购商详情页面查看"关联的产品"部分
- **Then** 系统显示该采购商关联的所有产品列表
- **And** 每个产品显示：产品名称、产品HS编码、关联的互动数量
- **And** 用户可以点击产品名称查看产品详情
- **And** 用户可以点击"查看互动历史"查看该采购商与该产品的完整互动记录

**AC2: 后端专员查看供应商关联的产品**
- **Given** 后端专员已登录系统
- **When** 后端专员在供应商详情页面查看"关联的产品"部分
- **Then** 系统显示该供应商关联的所有产品列表
- **And** 每个产品显示：产品名称、产品HS编码、关联的互动数量
- **And** 用户可以点击产品名称查看产品详情
- **And** 用户可以点击"查看互动历史"查看该供应商与该产品的完整互动记录

**AC3: 总监/管理员查看客户关联的产品**
- **Given** 总监或管理员已登录系统
- **When** 总监或管理员在客户详情页面查看"关联的产品"部分
- **Then** 系统显示该客户关联的所有产品列表
- **And** 系统显示所有类型的客户（采购商和供应商）关联的产品

**AC4: 产品列表排序和分页**
- **Given** 用户查看客户与产品的关联
- **When** 客户有关联的产品
- **Then** 产品列表按关联的互动数量排序（互动最多的在前）
- **And** 如果产品数量较多（> 10 个），系统使用分页或滚动加载显示
- **And** 系统显示关联产品总数

**AC5: 空状态处理**
- **Given** 用户查看客户与产品的关联
- **When** 客户没有关联的产品
- **Then** 系统显示空状态"该客户尚未与任何产品关联"
- **And** 系统提供提示"记录互动时关联产品，即可建立关联关系"

## Tasks / Subtasks

- [x] Task 1: 后端 API 实现 (AC: #1, #2, #3, #4)
  - [x] 创建客户产品关联服务 (CustomerProductAssociationService)
    - [x] 创建 `fenghua-backend/src/companies/customer-product-association.service.ts`
    - [x] 实现查询客户关联产品的方法 `getCustomerProducts(customerId, token, page, limit)`
    - [x] **验证客户是否存在**（在查询产品之前）：
      ```typescript
      const customerCheck = await this.pgPool.query(
        'SELECT id, customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
        [customerId]
      );
      if (customerCheck.rows.length === 0) {
        throw new NotFoundException('客户不存在');
      }
      ```
    - [x] 实现基于角色的数据过滤（使用 PermissionService.getDataAccessFilter）
    - [x] 使用 SQL JOIN 查询 `product_customer_interactions`、`products` 和 `companies` 表
    - [x] 统计每个产品的互动数量（使用 COUNT 和 GROUP BY）
    - [x] 实现 customer_type 大小写转换（PermissionService 返回小写，数据库存储大写）
    - [x] 实现分页支持（默认每页 10 条）
    - [x] 处理软删除的产品（过滤 `deleted_at IS NULL`）
    - [x] 处理无效的 product_id（通过 JOIN 自动过滤）
    - [x] 按互动数量降序排序（ORDER BY interaction_count DESC）
  - [x] 创建客户产品关联控制器 (CustomerProductAssociationController)
    - [x] 创建 `fenghua-backend/src/companies/customer-product-association.controller.ts`
    - [x] 创建 GET `/api/customers/:id/products` 端点
    - [x] 使用 `@UseGuards(JwtAuthGuard)` 保护端点
    - [x] 实现查询参数：`page`, `limit`
    - [x] 返回产品列表和总数
    - [x] 实现错误处理（客户不存在、权限检查失败、数据库错误）
  - [x] 创建 DTOs
    - [x] 创建 `fenghua-backend/src/companies/dto/customer-product-association.dto.ts`
    - [x] `CustomerProductAssociationDto` - 返回数据结构（包含产品信息和互动数量）
    - [x] `CustomerProductQueryDto` - 查询参数结构（page, limit）
  - [x] 注册服务和控制器到模块
    - [x] 在 `fenghua-backend/src/companies/companies.module.ts` 中添加服务和控制器

- [x] Task 2: 数据库查询优化 (AC: #4)
  - [x] **验证** `product_customer_interactions` 表索引已存在（迁移 002 已创建）：
    - [x] `idx_interactions_customer` - 按客户查询（已存在，迁移 002 第 64-66 行）
    - [x] `idx_interactions_product_customer` - 按客户和产品查询（已存在，迁移 002 第 69-71 行）
  - [x] 确认 `products` 表索引已创建
    - [x] `idx_products_hs_code` - 按HS编码查询（如果不存在，需要创建）
  - [x] 实现高效查询 SQL（使用 JOIN 避免 N+1 查询）：
    ```sql
    SELECT 
      p.id,
      p.name,
      p.hs_code,
      COUNT(pci.id) as interaction_count
    FROM product_customer_interactions pci
    INNER JOIN products p ON p.id = pci.product_id
    INNER JOIN companies c ON c.id = pci.customer_id  -- 必须 JOIN companies 表以过滤 customer_type
    WHERE pci.customer_id = $1 
      AND pci.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND c.deleted_at IS NULL  -- 过滤软删除的客户
      AND ($2::text IS NULL OR c.customer_type = $2)  -- 角色过滤
    GROUP BY p.id, p.name, p.hs_code
    ORDER BY interaction_count DESC
    LIMIT $3 OFFSET $4
    ```
  - [x] **性能优化提示：** 使用 `EXPLAIN ANALYZE` 验证查询计划，确保使用索引
    - [x] 对于大量数据，如果查询性能不足，考虑添加复合索引 `(customer_id, deleted_at)`
  - [x] 实现基于角色的客户类型过滤（在 SQL 查询中）
    - [x] 前端专员：只能查看采购商关联的产品（customer_type = 'BUYER'）
    - [x] 后端专员：只能查看供应商关联的产品（customer_type = 'SUPPLIER'）
    - [x] 总监/管理员：无过滤（返回所有客户关联的产品）
  - [x] 实现总数查询（用于分页）：
    ```sql
    SELECT COUNT(DISTINCT p.id)
    FROM product_customer_interactions pci
    INNER JOIN products p ON p.id = pci.product_id
    INNER JOIN companies c ON c.id = pci.customer_id
    WHERE pci.customer_id = $1 
      AND pci.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND c.deleted_at IS NULL
      AND ($2::text IS NULL OR c.customer_type = $2)
    ```

- [x] Task 3: 前端组件实现 (AC: #1, #2, #3, #4, #5)
  - [x] 创建 `CustomerProductAssociation` 组件
    - [x] 创建 `fenghua-frontend/src/customers/components/CustomerProductAssociation.tsx`
    - [x] 接收 `customerId` 和 `customer` 作为 props
    - [x] 使用 `useAuth()` 获取当前用户角色
    - [x] 根据角色显示不同的标题（"关联的产品"）
    - [x] **数据获取策略：** 参考 `ProductCustomerAssociation.tsx`，直接在组件中使用 `fetch` 调用 API，无需在 `customers.service.ts` 中添加新方法
    - [x] 使用 React Query 的 `useQuery` hook，缓存键：`['customer-products', customerId, page, limit]`
    - [x] 实现加载状态和错误处理
    - [x] **缓存失效策略：**
      - [x] 当客户更新时，使 `['customer-products', customerId]` 缓存失效
      - [x] 当产品更新时，使所有 `['customer-products']` 缓存失效（使用 `queryClient.invalidateQueries`）
      - [x] 设置 `staleTime: 5 * 60 * 1000`（5 分钟缓存）
  - [x] 实现产品列表显示
    - [x] 使用 Card 组件显示产品信息
    - [x] 每个产品显示：产品名称、产品HS编码、互动数量
    - [x] 实现产品名称点击跳转到产品详情（使用 Link 组件，路径：`/products/:id`）
    - [x] 实现"查看互动历史"按钮（跳转到 Story 3.5 的互动历史页面，路径：`/customers/:customerId/interactions?productId=:productId`）
      - **注意：** Story 3.5 尚未实现，此链接将在 Story 3.5 完成后生效
      - **临时方案：** 可以先实现按钮，但禁用或显示"即将推出"提示，直到 Story 3.5 完成
  - [x] 实现空状态显示 (AC: #5)
    - [x] 显示空状态图标和消息
    - [x] 显示提示文本"记录互动时关联产品，即可建立关联关系"
  - [x] 实现分页或滚动加载 (AC: #4)
    - [x] 如果产品数量 > 10，实现分页控件
    - [x] 或实现无限滚动加载（使用 React Query 的 `useInfiniteQuery`）
    - [x] 显示关联产品总数

- [x] Task 4: 集成到 CustomerDetailPanel (AC: #1, #2, #3)
  - [x] 在 `CustomerDetailPanel.tsx` 中，在"业务信息"卡片之后添加：
    ```tsx
    {/* 关联的产品 */}
    <CustomerProductAssociation customerId={customer.id} customer={customer} />
    ```
  - [x] 确保组件样式与 `ProductDetailPanel` 中的 `ProductCustomerAssociation` 一致
  - [x] 使用相同的 Card variant 和 padding（`variant="outlined" className="p-monday-4"`）
  - [x] 确保响应式布局（移动端适配）
  - [x] 确保组件位置合理（放在"业务信息"卡片之后）

- [x] Task 5: 角色权限验证 (AC: #1, #2, #3)
  - [x] 后端权限验证
    - [x] 使用 `PermissionService.getDataAccessFilter()` 获取数据访问过滤器
    - [x] 在 SQL 查询中应用过滤器（使用 UPPER() 转换大小写）
    - [x] 确保前端专员只能看到采购商关联的产品，后端专员只能看到供应商关联的产品
    - [x] 处理权限检查失败的情况（返回 403 Forbidden）
  - [x] 前端权限显示
    - [x] 使用 `isFrontendSpecialist()`, `isBackendSpecialist()`, `isDirector()`, `isAdmin()` 函数
    - [x] 根据角色显示相应的内容
    - [x] 处理权限错误（显示错误消息）

- [x] Task 6: 后端单元测试 (AC: #1, #2, #3, #4)
  - [x] 创建 `customer-product-association.service.spec.ts`
  - [x] 测试角色过滤逻辑（前端专员、后端专员、总监/管理员）
  - [x] 测试分页功能
  - [x] 测试排序功能（按互动数量降序）
  - [x] 测试空状态处理
  - [x] 测试错误处理（客户不存在、权限失败）

- [x] Task 7: 前端组件测试 (AC: #1, #2, #3, #4, #5)
  - [x] 创建 `CustomerProductAssociation.test.tsx`
  - [x] 测试产品列表显示
  - [x] 测试空状态显示
  - [x] 测试分页功能
  - [x] 测试角色权限显示
  - [x] 测试错误处理

## Dev Notes

### Architecture Patterns

- **参考 Story 2.4**: 本 Story 是 Story 2.4（产品与客户关联查看）的镜像实现，但方向相反（从客户查看产品）
- **数据模型**: 使用 `product_customer_interactions` 表作为关联表，通过 JOIN 查询获取关联关系
- **角色过滤**: 使用 `PermissionService.getDataAccessFilter()` 获取角色过滤器，在 SQL 查询中应用
- **分页策略**: 使用 SQL LIMIT/OFFSET 实现分页，默认每页 10 条
- **排序策略**: 按互动数量降序排序（ORDER BY interaction_count DESC）

### Technical Requirements

**后端实现：**
- 服务层：`CustomerProductAssociationService` - 处理业务逻辑和数据库查询
- 控制器层：`CustomerProductAssociationController` - 处理 HTTP 请求和响应
- DTO 层：`CustomerProductAssociationDto`, `CustomerProductQueryDto` - 数据传输对象
- 权限验证：使用 `JwtAuthGuard` 和 `PermissionService`
- 数据库查询：使用 PostgreSQL JOIN 查询，避免 N+1 查询问题

**前端实现：**
- 组件：`CustomerProductAssociation` - 显示客户关联的产品列表
- 数据获取：使用 React Query (`useQuery`) 获取和缓存数据
- 路由：产品详情链接到 `/products/:id`，互动历史链接到 `/customers/:customerId/interactions?productId=:productId`
- UI 组件：使用 Card、Button、Link 等现有 UI 组件

### Previous Story Intelligence

**Story 2.4 学习点（具体代码模式）：**
- **SQL 查询模式：** 使用 JOIN companies 表进行 customer_type 过滤：
  ```sql
  FROM product_customer_interactions pci
  INNER JOIN products p ON p.id = pci.product_id
  INNER JOIN companies c ON c.id = pci.customer_id  -- 必须 JOIN 以过滤 customer_type
  WHERE ... AND ($2::text IS NULL OR c.customer_type = $2)
  ```
- **错误处理模式：** 使用 try-catch 处理特定错误类型：
  ```typescript
  try {
    // query logic
  } catch (error) {
    if (error instanceof NotFoundException || error instanceof ForbiddenException) {
      throw error;
    }
    throw new BadRequestException('查询失败');
  }
  ```
- **React Query 缓存配置：**
  ```typescript
  useQuery({
    queryKey: ['customer-products', customerId, page, limit],
    queryFn: async () => { /* fetch logic */ },
    enabled: !!customerId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  })
  ```
- **组件结构模式：** 使用 Card 组件，包含 loading/error/empty 三种状态
- 使用 COUNT 和 GROUP BY 统计互动数量
- 实现基于角色的数据过滤（在 SQL 查询中应用）
- 实现分页和空状态处理

**Story 3.1 学习点：**
- 客户类型大小写转换（PermissionService 返回小写，数据库存储大写）
- 使用 `PermissionService.getDataAccessFilter()` 获取数据访问过滤器
- 错误处理模式（404 Not Found, 403 Forbidden）

**Story 3.2 学习点：**
- 搜索和过滤的实现模式
- 前端组件的数据加载和状态管理

**Story 3.3 学习点：**
- CustomerDetailPanel 的集成模式
- 详情面板的响应式设计
- 空字段处理模式

### Implementation Details

**SQL 查询示例（完整实现）：**
```sql
-- 查询客户关联的产品（带角色过滤）
-- 注意：必须 JOIN companies 表以获取 customer_type 进行角色过滤
SELECT 
  p.id,
  p.name,
  p.hs_code,
  COUNT(pci.id) as interaction_count
FROM product_customer_interactions pci
INNER JOIN products p ON p.id = pci.product_id
INNER JOIN companies c ON c.id = pci.customer_id  -- 必须 JOIN 以过滤 customer_type
WHERE pci.customer_id = $1 
  AND pci.deleted_at IS NULL
  AND p.deleted_at IS NULL
  AND c.deleted_at IS NULL  -- 过滤软删除的客户
  AND ($2::text IS NULL OR c.customer_type = $2)  -- 角色过滤（$2 为 customerTypeFilter）
GROUP BY p.id, p.name, p.hs_code
ORDER BY interaction_count DESC
LIMIT $3 OFFSET $4
```

**性能验证：**
- 使用 `EXPLAIN ANALYZE` 验证查询计划，确保使用索引 `idx_interactions_customer` 和 `idx_interactions_product_customer`
- 如果查询性能不足，考虑添加复合索引 `(customer_id, deleted_at)`

**前端组件结构：**
```tsx
interface CustomerProductAssociationProps {
  customerId: string;
  customer: Customer;
}

interface ProductAssociation {
  id: string;
  name: string;
  hsCode: string;
  interactionCount: number;
}
```

**API 端点：**
- `GET /api/customers/:id/products?page=1&limit=10`
- 返回：`{ products: ProductAssociation[]; total: number }`

### Testing Standards

- **后端测试**: 使用 Jest，测试服务层和控制器层
- **前端测试**: 使用 Vitest + React Testing Library，测试组件渲染和交互
- **集成测试**: 验证 API 端点和前端组件的集成

### Project Structure Notes

- 后端服务：`fenghua-backend/src/customers/customer-product-association.service.ts`
- 后端控制器：`fenghua-backend/src/customers/customer-product-association.controller.ts`
- 后端 DTO：`fenghua-backend/src/customers/dto/customer-product-association.dto.ts`
- 前端组件：`fenghua-frontend/src/customers/components/CustomerProductAssociation.tsx`
- 前端集成：`fenghua-frontend/src/customers/components/CustomerDetailPanel.tsx`

### References

- [Source: _bmad-output/epics.md#Story-3.4] - Story 3.4 的原始需求
- [Source: _bmad-output/implementation-artifacts/stories/2-4-product-customer-association-view.md] - Story 2.4 的实现参考
- [Source: _bmad-output/implementation-artifacts/stories/3-3-customer-details-view.md] - Story 3.3 的集成模式
- [Source: fenghua-backend/src/products/product-customer-association.service.ts] - 产品客户关联服务的实现参考
- [Source: fenghua-frontend/src/products/components/ProductCustomerAssociation.tsx] - 产品客户关联组件的实现参考

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

**后端文件：**
- `fenghua-backend/src/companies/customer-product-association.service.ts` - **NEW** - 客户产品关联服务
- `fenghua-backend/src/companies/customer-product-association.controller.ts` - **NEW** - 客户产品关联控制器
- `fenghua-backend/src/companies/dto/customer-product-association.dto.ts` - **NEW** - 客户产品关联 DTOs
- `fenghua-backend/src/companies/companies.module.ts` - **MODIFY** - 注册服务和控制器
- `fenghua-backend/src/companies/customer-product-association.service.spec.ts` - **NEW** - 后端单元测试（11 个测试用例，全部通过）

**前端文件：**
- `fenghua-frontend/src/customers/components/CustomerProductAssociation.tsx` - **NEW** - 客户产品关联组件
- `fenghua-frontend/src/customers/components/CustomerDetailPanel.tsx` - **MODIFY** - 集成 CustomerProductAssociation 组件
- `fenghua-frontend/src/customers/components/CustomerProductAssociation.test.tsx` - **NEW** - 前端组件测试（7 个测试用例，全部通过）

