# Story 3.5: 客户产品互动历史查看（按角色）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **前端专员/后端专员/总监/管理员**,
I want **查看某个客户针对某个产品的完整互动历史**,
So that **我可以了解该客户与该产品的业务往来情况，跟踪业务进展**.

## Acceptance Criteria

**AC1: 前端专员查看采购商产品互动历史**
- **Given** 前端专员已登录系统
- **When** 前端专员在采购商详情页面选择某个产品，点击"查看互动历史"
- **Then** 系统显示该采购商针对该产品的完整互动历史
- **And** 互动记录按时间顺序排列（最新的在前）
- **And** 每条互动记录显示：互动类型、互动时间、互动描述、创建者等
- **And** 系统只显示前端专员有权限查看的互动记录

**AC2: 后端专员查看供应商产品互动历史**
- **Given** 后端专员已登录系统
- **When** 后端专员在供应商详情页面选择某个产品，点击"查看互动历史"
- **Then** 系统显示该供应商针对该产品的完整互动历史
- **And** 互动记录按时间顺序排列
- **And** 系统只显示后端专员有权限查看的互动记录

**AC3: 总监/管理员查看客户产品互动历史**
- **Given** 总监或管理员已登录系统
- **When** 总监或管理员在客户详情页面选择某个产品，点击"查看互动历史"
- **Then** 系统显示该客户针对该产品的完整互动历史
- **And** 系统显示所有类型的互动记录

**AC4: 附件显示和下载**
- **Given** 用户查看客户产品互动历史
- **When** 互动记录包含附件（照片、文档等）
- **Then** 系统在互动记录中显示附件图标
- **And** 用户可以点击附件查看或下载

**AC5: 分页和滚动加载**
- **Given** 用户查看客户产品互动历史
- **When** 互动历史记录较多（> 20 条）
- **Then** 系统使用分页或滚动加载显示互动记录
- **And** 系统显示互动记录总数

**AC6: 空状态处理**
- **Given** 用户查看客户产品互动历史
- **When** 没有互动记录
- **Then** 系统显示空状态"该客户与该产品尚未有任何互动记录"
- **And** 系统提供"记录新互动"按钮，用户可以快速记录互动

## Tasks / Subtasks

- [x] Task 1: 后端 API 实现 (AC: #1, #2, #3, #5)
  - [x] 创建客户产品互动历史服务 (CustomerProductInteractionHistoryService)
    - [x] 创建 `fenghua-backend/src/companies/customer-product-interaction-history.service.ts`
    - [x] 实现查询客户-产品互动历史的方法 `getCustomerProductInteractions(customerId, productId, token, page, limit)`
    - [x] **验证客户是否存在**（在查询互动历史之前）：
      ```typescript
      const customerCheck = await this.pgPool.query(
        'SELECT id, customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
        [customerId]
      );
      if (customerCheck.rows.length === 0) {
        throw new NotFoundException('客户不存在');
      }
      ```
    - [x] **验证产品是否存在**（在查询互动历史之前）：
      ```typescript
      const productCheck = await this.pgPool.query(
        'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
        [productId]
      );
      if (productCheck.rows.length === 0) {
        throw new NotFoundException('产品不存在');
      }
      ```
    - [x] 实现基于角色的数据过滤（使用 PermissionService.getDataAccessFilter）
    - [x] 使用 SQL JOIN 查询 `product_customer_interactions`、`file_attachments` 和 `users` 表
    - [x] 实现按时间倒序排列（ORDER BY interaction_date DESC）
    - [x] 实现分页支持（默认每页 20 条）
    - [x] 处理软删除的互动记录（过滤 `deleted_at IS NULL`）
    - [x] 实现 customer_type 大小写转换（PermissionService 返回小写，数据库存储大写）
    - [x] 验证客户类型权限（如果用户只能查看特定类型的客户，验证客户类型）
  - [x] 创建客户产品互动历史控制器 (CustomerProductInteractionHistoryController)
    - [x] 创建 `fenghua-backend/src/companies/customer-product-interaction-history.controller.ts`
    - [x] 创建 GET `/api/customers/:customerId/interactions?productId=:productId&page=1&limit=20` 端点
    - [x] 使用 `@UseGuards(JwtAuthGuard)` 保护端点
    - [x] 实现查询参数：`productId`（必填）, `page`, `limit`
    - [x] 返回互动记录列表和总数
    - [x] 实现错误处理（客户不存在、产品不存在、权限检查失败、数据库错误）
  - [x] 创建 DTOs
    - [x] 创建 `fenghua-backend/src/companies/dto/customer-product-interaction-history.dto.ts`
    - [x] `CustomerProductInteractionDto` - 返回数据结构（包含互动信息和附件列表）
    - [x] `CustomerProductInteractionQueryDto` - 查询参数结构（productId, page, limit）
    - [x] `FileAttachmentDto` - 附件数据结构（复用或参考 Story 2.5 的 DTO）
  - [x] 注册服务和控制器到模块
    - [x] 在 `fenghua-backend/src/companies/companies.module.ts` 中添加服务和控制器

- [x] Task 2: 数据库查询优化 (AC: #1, #2, #3, #5)
  - [ ] **验证** `product_customer_interactions` 表索引已存在（迁移 002 已创建）：
    - [ ] `idx_interactions_customer` - 按客户查询（已存在，迁移 002 第 64-66 行）
    - [ ] `idx_interactions_product_customer` - 按产品和客户查询（已存在，迁移 002 第 69-71 行）
  - [ ] **验证** `file_attachments` 表索引已存在：
    - [ ] `idx_attachments_interaction` - 按互动记录查询附件（已存在）
  - [ ] **性能优化提示：** 使用 `EXPLAIN ANALYZE` 验证查询计划，确保使用索引 `idx_interactions_customer` 和 `idx_interactions_product_customer`
    - [ ] 对于大量数据，如果查询性能不足，考虑添加复合索引 `(customer_id, product_id, interaction_date)`
  - [ ] 实现高效查询 SQL（使用 JOIN 避免 N+1 查询）：
    ```sql
    SELECT 
      pci.id,
      pci.interaction_type,
      pci.interaction_date,
      pci.description,
      pci.status,
      pci.additional_info,
      pci.created_at,
      pci.created_by,
      u.email as creator_email,
      u.first_name as creator_first_name,
      u.last_name as creator_last_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id', fa.id,
            'fileName', fa.file_name,
            'fileUrl', fa.file_url,
            'fileType', fa.file_type,
            'fileSize', fa.file_size
          )
        ) FILTER (WHERE fa.id IS NOT NULL),
        '[]'::json
      ) as attachments
    FROM product_customer_interactions pci
    INNER JOIN companies c ON c.id = pci.customer_id
    LEFT JOIN users u ON u.id = pci.created_by
    LEFT JOIN file_attachments fa ON fa.interaction_id = pci.id AND fa.deleted_at IS NULL
    WHERE pci.customer_id = $1 
      AND pci.product_id = $2
      AND pci.deleted_at IS NULL
      AND c.deleted_at IS NULL
      AND ($3::text IS NULL OR c.customer_type = $3)  -- 角色过滤
    GROUP BY pci.id, pci.interaction_type, pci.interaction_date, pci.description, 
             pci.status, pci.additional_info, pci.created_at, pci.created_by,
             u.email, u.first_name, u.last_name
    ORDER BY pci.interaction_date DESC
    LIMIT $4 OFFSET $5
    ```
  - [ ] 实现基于角色的客户类型过滤（在 SQL 查询中）
    - [ ] 前端专员：只查询 `customer_type = 'BUYER'` 的客户的互动记录
    - [ ] 后端专员：只查询 `customer_type = 'SUPPLIER'` 的客户的互动记录
    - [ ] 总监/管理员：无过滤（返回所有互动记录）
  - [ ] 实现总数查询（用于分页）：
    ```sql
    SELECT COUNT(DISTINCT pci.id)
    FROM product_customer_interactions pci
    INNER JOIN companies c ON c.id = pci.customer_id
    WHERE pci.customer_id = $1 
      AND pci.product_id = $2
      AND pci.deleted_at IS NULL
      AND c.deleted_at IS NULL
      AND ($3::text IS NULL OR c.customer_type = $3)
    ```

- [x] Task 3: 前端组件实现 (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 创建 `CustomerProductInteractionHistory` 组件
    - [ ] 创建 `fenghua-frontend/src/customers/components/CustomerProductInteractionHistory.tsx`
    - [ ] 接收 `customerId` 和 `productId` 作为 props（从 URL 参数获取）
    - [ ] 使用 `useAuth()` 获取当前用户角色
    - [ ] **数据获取策略：** 参考 `ProductCustomerInteractionHistory.tsx`，直接在组件中使用 `fetch` 调用 API，无需在 `customers.service.ts` 中添加新方法
    - [ ] 使用 React Query 的 `useQuery` hook，缓存键：`['customer-interactions', customerId, productId, page, limit]`
    - [ ] 实现加载状态和错误处理
    - [ ] **缓存失效策略：**
      - [ ] 当互动记录创建/更新/删除时，使 `['customer-interactions', customerId, productId]` 缓存失效
      - [ ] 使用 `queryClient.invalidateQueries` 进行缓存失效
      - [ ] 设置 `staleTime: 5 * 60 * 1000`（5 分钟缓存）
  - [ ] 实现互动记录列表显示
    - [ ] 使用 Card 组件显示每条互动记录
    - [ ] 每条记录显示：互动类型标签、互动时间、互动描述、创建者信息
    - [ ] 实现互动类型的中文标签映射：
      ```typescript
      const INTERACTION_TYPE_LABELS: Record<string, string> = {
        // 采购商互动类型
        initial_contact: '初步接触',
        product_inquiry: '产品询价',
        quotation: '报价',
        quotation_accepted: '接受报价',
        quotation_rejected: '拒绝报价',
        order_signed: '签署订单',
        order_completed: '完成订单',
        // 供应商互动类型
        product_inquiry_supplier: '询价产品',
        quotation_received: '接收报价',
        specification_confirmed: '产品规格确认',
        production_progress: '生产进度跟进',
        pre_shipment_inspection: '发货前验收',
        shipped: '已发货',
      };
      ```
    - [ ] 实现互动类型颜色标签函数：
      ```typescript
      const getInteractionTypeColor = (type: string): string => {
        const buyerTypes = ['initial_contact', 'product_inquiry', 'quotation', 'quotation_accepted', 'quotation_rejected', 'order_signed', 'order_completed'];
        const supplierTypes = ['product_inquiry_supplier', 'quotation_received', 'specification_confirmed', 'production_progress', 'pre_shipment_inspection', 'shipped'];
        if (buyerTypes.includes(type)) return 'bg-primary-blue/10 text-primary-blue';
        if (supplierTypes.includes(type)) return 'bg-primary-purple/10 text-primary-purple';
        return 'bg-gray-100 text-monday-text-secondary';
      };
      ```
  - [ ] 实现附件显示 (AC: #4)
    - [ ] 如果互动记录有附件，显示附件图标
    - [ ] 实现附件列表显示（文件名、文件类型、文件大小）
    - [ ] 实现附件点击查看/下载功能（使用 `fileUrl`，参考 `ProductCustomerInteractionHistory.tsx` 的 `handleAttachmentClick` 模式）：
      ```typescript
      const handleAttachmentClick = (attachment: FileAttachment) => {
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      };
      ```
    - [ ] 实现附件显示组件（参考 `ProductCustomerInteractionHistory.tsx` 的 `InteractionCard` 子组件）：
      ```tsx
      {interaction.attachments && interaction.attachments.length > 0 && (
        <div className="mt-monday-3 pt-monday-3 border-t border-gray-200">
          <div className="text-monday-xs text-monday-text-secondary mb-monday-2">附件：</div>
          <div className="flex flex-wrap gap-monday-2">
            {interaction.attachments.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => handleAttachmentClick(attachment)}
                className="flex items-center gap-monday-1 px-monday-2 py-monday-1 rounded-monday-md bg-gray-50 hover:bg-gray-100 text-monday-xs text-monday-text-secondary hover:text-monday-text transition-colors"
              >
                <span>📎</span>
                <span>{attachment.fileName}</span>
                <span className="text-monday-xs opacity-60">
                  ({(attachment.fileSize / 1024).toFixed(1)} KB)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      ```
    - [ ] 实现图片附件预览（如果是图片类型）
  - [ ] 实现空状态显示 (AC: #6)
    - [ ] 显示空状态图标和消息
    - [ ] 显示"记录新互动"按钮（跳转到互动记录创建页面，路径：`/interactions/create?customerId=:customerId&productId=:productId`）
  - [ ] 实现分页或滚动加载 (AC: #5)
    - [ ] 如果互动记录数量 > 20，实现分页控件
    - [ ] 或实现无限滚动加载（使用 React Query 的 `useInfiniteQuery`）
    - [ ] 显示互动记录总数

- [x] Task 4: 创建互动历史页面 (AC: #1, #2, #3)
  - [ ] 创建页面组件文件: `fenghua-frontend/src/customers/CustomerProductInteractionHistoryPage.tsx`
    - [ ] 路由路径：`/customers/:customerId/interactions?productId=:productId`
    - [ ] 从 URL 参数获取 `customerId`（使用 `useParams`）和 `productId`（使用 `useSearchParams`）
    - [ ] 使用 `MainLayout` 布局
    - [ ] 显示页面标题（"客户与产品互动历史"）
    - [ ] 使用 API 调用 `GET /api/customers/:customerId` 获取客户信息
    - [ ] 使用 API 调用 `GET /api/products/:productId` 获取产品信息
    - [ ] 显示客户名称和产品名称（从 API 获取）
    - [ ] 集成 `CustomerProductInteractionHistory` 组件
  - [ ] 添加路由配置到 `fenghua-frontend/src/App.tsx`
    - [ ] 在 `<Routes>` 内添加：`<Route path="/customers/:customerId/interactions" element={<ProtectedRoute><CustomerProductInteractionHistoryPage /></ProtectedRoute>} />`
    - [ ] 使用 `ProtectedRoute` 保护路由（参考现有路由模式）

- [x] Task 5: 集成到 CustomerProductAssociation 组件 (AC: #1, #2, #3)
  - [ ] 在 `CustomerProductAssociation.tsx` 中，更新"查看互动历史"按钮
    - [ ] 将按钮从 `disabled={true}` 改为 `disabled={false}`
    - [ ] 更新 Link 路径为：`/customers/${customerId}/interactions?productId=${product.id}`
    - [ ] 移除 `title="Story 3.5 尚未实现"` 属性

- [x] Task 6: 角色权限验证 (AC: #1, #2, #3)
  - [ ] 后端权限验证
    - [ ] 使用 `PermissionService.getDataAccessFilter()` 获取数据访问过滤器
    - [ ] 在 SQL 查询中应用过滤器（使用 UPPER() 转换大小写）
    - [ ] 确保前端专员只能看到采购商类型的客户的互动记录
    - [ ] 确保后端专员只能看到供应商类型的客户的互动记录
    - [ ] 处理权限检查失败的情况（返回 403 Forbidden）
  - [ ] 前端权限显示
    - [ ] 使用 `isFrontendSpecialist()`, `isBackendSpecialist()`, `isDirector()`, `isAdmin()` 函数
    - [ ] 根据角色显示不同的标题和内容
    - [ ] 处理权限错误（显示错误消息）

- [x] Task 7: 后端单元测试 (AC: #1, #2, #3, #5)
  - [ ] 创建 `customer-product-interaction-history.service.spec.ts`
  - [ ] 测试角色过滤逻辑（前端专员、后端专员、总监/管理员）
  - [ ] 测试分页功能
  - [ ] 测试排序功能（按互动时间倒序）
  - [ ] 测试空状态处理
  - [ ] 测试错误处理（客户不存在、产品不存在、权限失败）

- [x] Task 8: 前端组件测试 (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 创建 `CustomerProductInteractionHistory.test.tsx`
  - [ ] 测试互动记录列表显示
  - [ ] 测试附件显示
  - [ ] 测试空状态显示
  - [ ] 测试分页功能
  - [ ] 测试角色权限显示
  - [ ] 测试错误处理

## Dev Notes

### Architecture Patterns

- **参考 Story 2.5**: 本 Story 是 Story 2.5（产品与客户互动历史查看）的镜像实现，但方向相反（从客户查看产品互动历史）
- **数据模型**: 使用 `product_customer_interactions` 表作为互动记录表，通过 JOIN 查询获取互动历史和附件
- **角色过滤**: 使用 `PermissionService.getDataAccessFilter()` 获取角色过滤器，在 SQL 查询中应用
- **分页策略**: 使用 SQL LIMIT/OFFSET 实现分页，默认每页 20 条
- **排序策略**: 按互动时间倒序排序（ORDER BY interaction_date DESC）

### Technical Requirements

**后端实现：**
- 服务层：`CustomerProductInteractionHistoryService` - 处理业务逻辑和数据库查询
- 控制器层：`CustomerProductInteractionHistoryController` - 处理 HTTP 请求和响应
- DTO 层：`CustomerProductInteractionDto`, `CustomerProductInteractionQueryDto`, `FileAttachmentDto` - 数据传输对象
- 权限验证：使用 `JwtAuthGuard` 和 `PermissionService`
- 数据库查询：使用 PostgreSQL JOIN 查询，避免 N+1 查询问题

**前端实现：**
- 组件：`CustomerProductInteractionHistory` - 显示客户产品互动历史列表
- 页面：`CustomerProductInteractionHistoryPage` - 互动历史页面
- 数据获取：使用 React Query (`useQuery`) 获取和缓存数据
- 路由：互动历史页面链接到 `/customers/:customerId/interactions?productId=:productId`
- UI 组件：使用 Card、Button、Link 等现有 UI 组件

### Previous Story Intelligence

**Story 2.5 学习点（具体代码模式）：**
- **SQL 查询模式：** 使用 JOIN companies、users 和 file_attachments 表：
  ```sql
  FROM product_customer_interactions pci
  INNER JOIN companies c ON c.id = pci.customer_id
  LEFT JOIN users u ON u.id = pci.created_by
  LEFT JOIN file_attachments fa ON fa.interaction_id = pci.id AND fa.deleted_at IS NULL
  WHERE pci.customer_id = $1 AND pci.product_id = $2
    AND ($3::text IS NULL OR c.customer_type = $3)
  ```
- **错误处理模式：** 验证客户和产品都存在，处理权限检查失败：
  ```typescript
  // 验证客户
  const customerCheck = await this.pgPool.query(
    'SELECT id, customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
    [customerId]
  );
  if (customerCheck.rows.length === 0) {
    throw new NotFoundException('客户不存在');
  }
  const customerType = customerCheck.rows[0].customer_type;
  // 验证产品
  const productCheck = await this.pgPool.query(
    'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
    [productId]
  );
  if (productCheck.rows.length === 0) {
    throw new NotFoundException('产品不存在');
  }
  // 权限检查
  if (customerTypeFilter && customerType !== customerTypeFilter) {
    throw new ForbiddenException('您没有权限查看该客户的互动历史');
  }
  ```
- **React Query 缓存配置：**
  ```typescript
  useQuery({
    queryKey: ['customer-interactions', customerId, productId, page, limit],
    queryFn: async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3006';
      const response = await fetch(
        `${apiBaseUrl}/api/customers/${customerId}/interactions?productId=${productId}&page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        if (response.status === 403) throw new Error('您没有权限查看互动历史');
        if (response.status === 404) throw new Error('客户或产品不存在');
        throw new Error('获取互动历史失败');
      }
      return response.json();
    },
    enabled: !!customerId && !!productId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  })
  ```
- **附件处理：** 使用 `json_agg` 聚合附件，前端解析 JSON 数组
- **Creator 信息处理：** 使用 LEFT JOIN users 表获取创建者 email、first_name、last_name
- **互动类型映射：** 必须使用与 Story 2.5 完全相同的 `INTERACTION_TYPE_LABELS` 和 `getInteractionTypeColor` 函数（见 Task 3 具体实现）

**Story 3.4 学习点：**
- 客户验证模式（验证客户是否存在和类型）
- 客户类型权限检查模式
- 前端组件集成到 CustomerDetailPanel 的模式

### Implementation Details

**SQL 查询示例（完整实现）：**
```sql
-- 查询客户产品互动历史（带角色过滤和附件）
-- 注意：必须 JOIN companies 表以获取 customer_type 进行角色过滤
SELECT 
  pci.id,
  pci.interaction_type,
  pci.interaction_date,
  pci.description,
  pci.status,
  pci.additional_info,
  pci.created_at,
  pci.created_by,
  u.email as creator_email,
  u.first_name as creator_first_name,
  u.last_name as creator_last_name,
  COALESCE(
    json_agg(
      json_build_object(
        'id', fa.id,
        'fileName', fa.file_name,
        'fileUrl', fa.file_url,
        'fileType', fa.file_type,
        'fileSize', fa.file_size,
        'mimeType', fa.mime_type
      )
    ) FILTER (WHERE fa.id IS NOT NULL),
    '[]'::json
  ) as attachments
FROM product_customer_interactions pci
INNER JOIN companies c ON c.id = pci.customer_id  -- 必须 JOIN 以过滤 customer_type
LEFT JOIN users u ON u.id = pci.created_by
LEFT JOIN file_attachments fa ON fa.interaction_id = pci.id AND fa.deleted_at IS NULL
WHERE pci.customer_id = $1 
  AND pci.product_id = $2
  AND pci.deleted_at IS NULL
  AND c.deleted_at IS NULL  -- 过滤软删除的客户
  AND ($3::text IS NULL OR c.customer_type = $3)  -- 角色过滤（$3 为 customerTypeFilter）
GROUP BY pci.id, pci.interaction_type, pci.interaction_date, pci.description, 
         pci.status, pci.additional_info, pci.created_at, pci.created_by,
         u.email, u.first_name, u.last_name
ORDER BY pci.interaction_date DESC
LIMIT $4 OFFSET $5
```

**性能验证：**
- 使用 `EXPLAIN ANALYZE` 验证查询计划，确保使用索引 `idx_interactions_customer` 和 `idx_interactions_product_customer`
- 如果查询性能不足，考虑添加复合索引 `(customer_id, product_id, interaction_date)`

**前端组件结构：**
```tsx
interface CustomerProductInteractionHistoryProps {
  customerId: string;
  productId: string;
}

interface Interaction {
  id: string;
  interactionType: string;
  interactionDate: string;
  description?: string;
  status?: string;
  additionalInfo?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
  creator?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  attachments: FileAttachment[];
}

interface FileAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
}
```

**API 端点：**
- `GET /api/customers/:customerId/interactions?productId=:productId&page=1&limit=20`
- 返回：`{ interactions: CustomerProductInteractionDto[]; total: number }`

### Testing Standards

- **后端测试**: 使用 Jest，测试服务层和控制器层
- **前端测试**: 使用 Vitest + React Testing Library，测试组件渲染和交互
- **集成测试**: 验证 API 端点和前端组件的集成

### Project Structure Notes

- 后端服务：`fenghua-backend/src/companies/customer-product-interaction-history.service.ts`
- 后端控制器：`fenghua-backend/src/companies/customer-product-interaction-history.controller.ts`
- 后端 DTO：`fenghua-backend/src/companies/dto/customer-product-interaction-history.dto.ts`
- 前端组件：`fenghua-frontend/src/customers/components/CustomerProductInteractionHistory.tsx`
- 前端页面：`fenghua-frontend/src/customers/CustomerProductInteractionHistoryPage.tsx`
- 前端集成：`fenghua-frontend/src/customers/components/CustomerProductAssociation.tsx`

### References

- [Source: _bmad-output/epics.md#Story-3.5] - Story 3.5 的原始需求
- [Source: _bmad-output/implementation-artifacts/stories/2-5-product-customer-interaction-history.md] - Story 2.5 的实现参考
- [Source: _bmad-output/implementation-artifacts/stories/3-4-customer-product-association-view.md] - Story 3.4 的集成模式
- [Source: fenghua-backend/src/products/product-customer-interaction-history.service.ts] - 产品客户互动历史服务的实现参考
- [Source: fenghua-frontend/src/products/components/ProductCustomerInteractionHistory.tsx] - 产品客户互动历史组件的实现参考

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

- `fenghua-backend/src/companies/dto/customer-product-interaction-history.dto.ts` - **NEW** - DTOs for customer-product interaction history
- `fenghua-backend/src/companies/customer-product-interaction-history.service.ts` - **NEW** - Backend service for customer-product interaction history
- `fenghua-backend/src/companies/customer-product-interaction-history.controller.ts` - **NEW** - Backend controller for customer-product interaction history
- `fenghua-backend/src/companies/companies.module.ts` - **MODIFY** - Registered new service and controller
- `fenghua-backend/src/companies/customer-product-interaction-history.service.spec.ts` - **NEW** - Unit tests for backend service
- `fenghua-frontend/src/customers/components/CustomerProductInteractionHistory.tsx` - **NEW** - Frontend component for customer-product interaction history
- `fenghua-frontend/src/customers/CustomerProductInteractionHistoryPage.tsx` - **NEW** - Frontend page for customer-product interaction history
- `fenghua-frontend/src/customers/components/CustomerProductAssociation.tsx` - **MODIFY** - Enabled "查看互动历史" button
- `fenghua-frontend/src/App.tsx` - **MODIFY** - Added route for customer-product interaction history page
- `fenghua-frontend/src/customers/components/CustomerProductInteractionHistory.test.tsx` - **NEW** - Unit tests for frontend component

