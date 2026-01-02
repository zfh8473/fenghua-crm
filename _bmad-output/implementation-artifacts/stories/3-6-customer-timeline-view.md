# Story 3.6: 客户时间线视图（按角色）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **前端专员/后端专员/总监/管理员**,
I want **查看客户的时间线视图（所有互动按时间顺序显示）**,
So that **我可以按时间顺序查看该客户的所有业务互动，了解客户关系的发展历程**.

## Acceptance Criteria

**AC1: 前端专员查看采购商时间线视图**
- **Given** 前端专员已登录系统
- **When** 前端专员在采购商详情页面点击"时间线视图"
- **Then** 系统显示该采购商的所有互动记录
- **And** 互动记录按时间顺序排列（最新的在前或最旧的在前，用户可选择）
- **And** 每条互动记录显示：互动时间、互动类型、关联的产品、互动描述、创建者等
- **And** 系统以时间线形式展示，每条记录显示在对应的时间点上

**AC2: 后端专员查看供应商时间线视图**
- **Given** 后端专员已登录系统
- **When** 后端专员在供应商详情页面点击"时间线视图"
- **Then** 系统显示该供应商的所有互动记录
- **And** 互动记录按时间顺序排列
- **And** 系统只显示后端专员有权限查看的互动记录

**AC3: 总监/管理员查看客户时间线视图**
- **Given** 总监或管理员已登录系统
- **When** 总监或管理员在客户详情页面点击"时间线视图"
- **Then** 系统显示该客户的所有互动记录
- **And** 系统显示所有类型的互动记录（采购商和供应商的互动）

**AC4: 时间线记录分页和筛选**
- **Given** 用户查看客户时间线视图
- **When** 时间线记录较多（> 50 条）
- **Then** 系统使用虚拟滚动或分页加载显示记录
- **And** 系统显示互动记录总数
- **And** 用户可以按时间范围筛选（如最近一周、最近一月、最近一年）

**AC5: 互动记录详情查看**
- **Given** 用户查看客户时间线视图
- **When** 用户点击某条互动记录
- **Then** 系统显示该互动记录的详细信息
- **And** 用户可以查看该互动关联的产品信息
- **And** 用户可以查看该互动的附件（如果有）

**AC6: 空状态处理**
- **Given** 用户查看客户时间线视图
- **When** 没有互动记录
- **Then** 系统显示空状态"该客户尚未有任何互动记录"
- **And** 系统提供"记录新互动"按钮

## Tasks / Subtasks

- [x] Task 1: 后端 API 实现 (AC: #1, #2, #3, #4)
  - [x] 创建客户时间线服务 (CustomerTimelineService)
    - [x] 创建 `fenghua-backend/src/companies/customer-timeline.service.ts`
    - [x] 实现查询客户时间线的方法 `getCustomerTimeline(customerId, token, page, limit, sortOrder, dateRange)`
    - [x] **验证客户是否存在**（在查询时间线之前）：
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
    - [x] 使用 SQL JOIN 查询 `product_customer_interactions`、`products`、`file_attachments` 和 `users` 表
    - [x] 实现按时间排序（ORDER BY interaction_date DESC/ASC，根据 sortOrder 参数）
      - [x] **注意：** PostgreSQL 无法参数化 ORDER BY 方向，必须使用字符串插值：
        ```typescript
        const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
        const query = `... ORDER BY pci.interaction_date ${orderDirection} ...`;
        ```
    - [x] 实现分页支持（默认每页 50 条）
    - [x] 实现时间范围筛选（dateRange: 'week' | 'month' | 'year' | 'all'）
      - [x] **计算日期范围起始日期：**
        ```typescript
        let dateRangeStart: Date | null = null;
        if (dateRange === 'week') {
          dateRangeStart = new Date();
          dateRangeStart.setDate(dateRangeStart.getDate() - 7);
        } else if (dateRange === 'month') {
          dateRangeStart = new Date();
          dateRangeStart.setDate(dateRangeStart.getDate() - 30);
        } else if (dateRange === 'year') {
          dateRangeStart = new Date();
          dateRangeStart.setDate(dateRangeStart.getDate() - 365);
        }
        // dateRange === 'all' means dateRangeStart remains null
        ```
    - [x] 处理软删除的互动记录（过滤 `deleted_at IS NULL`）
    - [x] 实现 customer_type 大小写转换（PermissionService 返回小写，数据库存储大写）
    - [x] 验证客户类型权限（如果用户只能查看特定类型的客户，验证客户类型）
    - [x] 添加 SQL ORDER BY 参数验证（防御性编程）
  - [x] 创建客户时间线控制器 (CustomerTimelineController)
    - [x] 创建 `fenghua-backend/src/companies/customer-timeline.controller.ts`
    - [x] 创建 GET `/api/customers/:customerId/timeline?page=1&limit=50&sortOrder=desc&dateRange=all` 端点
    - [x] 使用 `@UseGuards(JwtAuthGuard)` 保护端点
    - [x] 实现查询参数：`page`, `limit`, `sortOrder`（'asc' | 'desc'），`dateRange`（'week' | 'month' | 'year' | 'all'）
    - [x] 返回互动记录列表和总数
    - [x] 实现错误处理（客户不存在、权限检查失败、数据库错误）
  - [x] 创建 DTOs
    - [x] 创建 `fenghua-backend/src/companies/dto/customer-timeline.dto.ts`
    - [x] `CustomerTimelineInteractionDto` - 返回数据结构（包含互动信息、产品信息、附件列表）
    - [x] `CustomerTimelineQueryDto` - 查询参数结构（page, limit, sortOrder, dateRange）
    - [x] `FileAttachmentDto` - 附件数据结构（复用 Story 3.5 的 DTO）
  - [x] 注册服务和控制器到模块
    - [x] 在 `fenghua-backend/src/companies/companies.module.ts` 中添加服务和控制器

- [x] Task 2: 数据库查询优化 (AC: #1, #2, #3, #4)
  - [x] **验证** `product_customer_interactions` 表索引已存在（迁移 002 已创建）：
    - [x] `idx_interactions_customer` - 按客户查询（已存在，迁移 002 第 64-66 行）
    - [x] `idx_interactions_product_customer` - 按产品和客户查询（已存在，迁移 002 第 69-71 行）
  - [x] **性能优化提示：** 使用 `EXPLAIN ANALYZE` 验证查询计划，确保使用索引 `idx_interactions_customer`
    - [x] 验证索引包含 `interaction_date` 字段以优化时间范围查询
    - [x] 对于大量数据，如果查询性能不足，考虑添加复合索引 `(customer_id, interaction_date, deleted_at)`
    - [x] 时间范围筛选时，确保索引能够有效支持 `interaction_date >= $3` 条件
  - [x] 实现高效查询 SQL（使用 JOIN 避免 N+1 查询）
    - [x] **注意：** 与 Story 3.5 的关键差异：本 Story 不限定产品（WHERE 子句不包含 `pci.product_id = $2`），查询客户的所有互动记录
    - [x] SQL 查询实现（见 Implementation Details 部分的完整 SQL）
  - [x] 实现基于角色的客户类型过滤（在 SQL 查询中）
    - [x] 前端专员：只查询 `customer_type = 'BUYER'` 的客户的互动记录
    - [x] 后端专员：只查询 `customer_type = 'SUPPLIER'` 的客户的互动记录
    - [x] 总监/管理员：无过滤（返回所有互动记录）
  - [x] 实现时间范围筛选（在服务层计算日期，在 SQL 查询中使用）
    - [x] 在服务层计算 `dateRangeStart`（见 Task 1 的日期计算代码）
    - [x] 在 SQL WHERE 子句中使用：`AND ($3::timestamp IS NULL OR pci.interaction_date >= $3)`
    - [x] 确保索引 `idx_interactions_customer` 包含 `interaction_date` 以优化时间范围查询性能
    - [x] 如果索引不包含 `interaction_date`，考虑添加复合索引 `(customer_id, interaction_date, deleted_at)`
  - [x] 实现总数查询（用于分页）

- [x] Task 3: 前端组件实现 (AC: #1, #2, #3, #4, #5, #6)
  - [x] 创建 `CustomerTimeline` 组件
    - [x] 创建 `fenghua-frontend/src/customers/components/CustomerTimeline.tsx`
    - [x] 接收 `customerId` 作为 props
    - [x] 使用 `useAuth()` 获取当前用户角色
    - [x] **数据获取策略：** 参考 `CustomerProductInteractionHistory.tsx`，直接在组件中使用 `fetch` 调用 API，无需在 `customers.service.ts` 中添加新方法
    - [x] 使用 React Query 的 `useQuery` hook，缓存键：`['customer-timeline', customerId, page, limit, sortOrder, dateRange]`
    - [x] 实现加载状态和错误处理
    - [x] **缓存失效策略：**
      - [x] 当互动记录创建/更新/删除时，使 `['customer-timeline', customerId]` 缓存失效
      - [x] 使用 `queryClient.invalidateQueries` 进行缓存失效
      - [x] 设置 `staleTime: 5 * 60 * 1000`（5 分钟缓存）
  - [x] 实现时间线视图显示
    - [x] 使用时间线组件展示互动记录（参考 `ProductBusinessProcess.tsx` 的时间线样式）
    - [x] 实现时间线布局结构：
      ```tsx
      <div className="flex items-start gap-monday-4">
        {/* Timeline line and dot */}
        <div className="flex flex-col items-center">
          <div className="w-monday-10 h-monday-10 rounded-full bg-primary-blue/10 flex items-center justify-center text-monday-sm font-semibold">
            {/* Dot content - can use interaction type icon */}
          </div>
          {!isLast && <div className="w-0.5 h-full min-h-monday-8 bg-gray-300 mt-monday-2" />}
        </div>
        {/* Interaction card */}
        <div className="flex-1 pb-monday-6">
          <Card variant="outlined" className="p-monday-4">...</Card>
        </div>
      </div>
      ```
    - [x] 实现时间标签格式化函数：
      ```typescript
      const getTimeLabel = (date: Date): string => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - today.getDay());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const interactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (interactionDate.getTime() === today.getTime()) return '今天';
        if (interactionDate.getTime() === yesterday.getTime()) return '昨天';
        if (interactionDate >= thisWeek) return '本周';
        if (interactionDate >= thisMonth) return '本月';
        return date.toLocaleDateString('zh-CN');
      };
      ```
    - [x] 显示时间标记（使用 `getTimeLabel` 函数格式化时间）
    - [x] 实现时间线圆点和连接线样式（参考 `ProductBusinessProcess.tsx` 的 `StageCard` 组件）
  - [x] 实现互动记录卡片显示
    - [x] 使用 Card 组件显示每条互动记录
    - [x] 每条记录显示：互动类型标签、互动时间、关联的产品（产品名称和HS编码）、互动描述、创建者信息
    - [x] 实现互动类型的中文标签映射（**必须与 Story 3.5 完全一致**）：
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
    - [x] 实现互动类型颜色标签函数（**必须与 Story 3.5 完全一致**）：
      ```typescript
      const getInteractionTypeColor = (type: string): string => {
        const buyerTypes = ['initial_contact', 'product_inquiry', 'quotation', 'quotation_accepted', 'quotation_rejected', 'order_signed', 'order_completed'];
        const supplierTypes = ['product_inquiry_supplier', 'quotation_received', 'specification_confirmed', 'production_progress', 'pre_shipment_inspection', 'shipped'];
        if (buyerTypes.includes(type)) return 'bg-primary-blue/10 text-primary-blue';
        if (supplierTypes.includes(type)) return 'bg-primary-purple/10 text-primary-purple';
        return 'bg-gray-100 text-monday-text-secondary';
      };
      ```
    - [x] 实现产品信息显示（产品名称可点击跳转到产品详情）
  - [x] 实现附件显示 (AC: #5)
    - [x] 如果互动记录有附件，显示附件图标
    - [x] 实现附件列表显示（文件名、文件类型、文件大小）
    - [x] 实现附件点击查看/下载功能（复用 Story 3.5 的 `handleAttachmentClick` 模式）
  - [x] 实现排序功能 (AC: #1)
    - [x] 提供排序选择器（最新的在前/最旧的在前）
    - [x] 使用 `sortOrder` 参数控制排序方向
  - [x] 实现时间范围筛选 (AC: #4)
    - [x] 提供时间范围选择器（最近一周、最近一月、最近一年、全部）
    - [x] 使用 `dateRange` 参数控制筛选范围
  - [x] 实现分页或虚拟滚动 (AC: #4)
    - [x] **决策指导：**
      - [x] 如果总记录数 < 200：使用分页控件（实现更简单）
      - [x] 如果总记录数 >= 200：使用无限滚动（使用 React Query 的 `useInfiniteQuery`，性能更好）
    - [x] 当前实现：使用分页控件（上一页/下一页，显示当前页和总页数）
    - [x] 显示互动记录总数
    - [x] **注意：** 虚拟滚动功能可在后续优化中实现（当实际数据量 >= 200 时）
  - [x] 实现互动记录详情查看 (AC: #5)
    - [x] 点击互动记录卡片时，显示详情模态框
    - [x] 详情显示：完整互动信息、关联产品信息、附件列表
    - [x] 实现模态框键盘导航（ESC 键关闭，Tab 键焦点陷阱）
    - [x] 实现无障碍性（ARIA 标签、焦点管理）
  - [x] 实现空状态显示 (AC: #6)
    - [x] 显示空状态图标和消息
    - [x] 显示"记录新互动"按钮（跳转到互动记录创建页面，路径：`/interactions/create?customerId=:customerId`）

- [x] Task 4: 集成到 CustomerDetailPanel (AC: #1, #2, #3)
  - [x] 在 `CustomerDetailPanel.tsx` 中，添加"时间线视图"按钮或标签页
    - [x] 在"关联的产品"卡片之后添加时间线视图部分
    - [x] 或使用标签页切换（详情视图/时间线视图）
  - [x] 集成 `CustomerTimeline` 组件
  - [x] 确保组件样式与现有组件一致
  - [x] 使用相同的 Card variant 和 padding（`variant="outlined" className="p-monday-4"`）
  - [x] 确保响应式布局（移动端适配）

- [x] Task 5: 角色权限验证 (AC: #1, #2, #3)
  - [x] 后端权限验证
    - [x] 使用 `PermissionService.getDataAccessFilter()` 获取数据访问过滤器
    - [x] 在 SQL 查询中应用过滤器（使用 UPPER() 转换大小写）
    - [x] 确保前端专员只能看到采购商类型的客户的互动记录
    - [x] 确保后端专员只能看到供应商类型的客户的互动记录
    - [x] 处理权限检查失败的情况（返回 403 Forbidden）
  - [x] 前端权限显示
    - [x] 使用 `isFrontendSpecialist()`, `isBackendSpecialist()`, `isDirector()`, `isAdmin()` 函数
    - [x] 根据角色显示相应的内容（显示角色相关的标题）
    - [x] 处理权限错误（显示错误消息）

- [x] Task 6: 后端单元测试 (AC: #1, #2, #3, #4)
  - [x] 创建 `customer-timeline.service.spec.ts`
  - [x] 测试角色过滤逻辑（前端专员、后端专员、总监/管理员）
  - [x] 测试分页功能
  - [x] 测试排序功能（按互动时间正序/倒序）
  - [x] 测试时间范围筛选功能
  - [x] 测试空状态处理
  - [x] 测试错误处理（客户不存在、权限失败）

- [x] Task 7: 前端组件测试 (AC: #1, #2, #3, #4, #5, #6)
  - [x] 创建 `CustomerTimeline.test.tsx`
  - [x] 测试时间线记录列表显示
  - [x] 测试附件显示
  - [x] 测试空状态显示
  - [x] 测试分页功能
  - [x] 测试排序功能
  - [x] 测试时间范围筛选功能
  - [x] 测试角色权限显示
  - [x] 测试错误处理

## Dev Notes

### Architecture Patterns

- **参考 Story 3.5**: 本 Story 是 Story 3.5（客户产品互动历史查看）的扩展
- **关键差异：** Story 3.5 查询特定客户和特定产品的互动记录（WHERE 包含 `pci.customer_id = $1 AND pci.product_id = $2`），而本 Story 查询客户的所有互动记录（WHERE 只包含 `pci.customer_id = $1`，不限定产品）
- **数据模型**: 使用 `product_customer_interactions` 表作为互动记录表，通过 JOIN 查询获取互动历史、产品信息和附件
- **角色过滤**: 使用 `PermissionService.getDataAccessFilter()` 获取角色过滤器，在 SQL 查询中应用
- **分页策略**: 使用 SQL LIMIT/OFFSET 实现分页，默认每页 50 条
- **排序策略**: 按互动时间排序（ORDER BY interaction_date DESC/ASC，用户可选择，注意：必须使用字符串插值，不能参数化）
- **时间线视图**: 使用垂直时间线布局，参考 `ProductBusinessProcess.tsx` 的时间线样式

### Technical Requirements

**后端实现：**
- 服务层：`CustomerTimelineService` - 处理业务逻辑和数据库查询
- 控制器层：`CustomerTimelineController` - 处理 HTTP 请求和响应
- DTO 层：`CustomerTimelineInteractionDto`, `CustomerTimelineQueryDto`, `FileAttachmentDto` - 数据传输对象
- 权限验证：使用 `JwtAuthGuard` 和 `PermissionService`
- 数据库查询：使用 PostgreSQL JOIN 查询，避免 N+1 查询问题

**前端实现：**
- 组件：`CustomerTimeline` - 显示客户时间线视图
- 数据获取：使用 React Query (`useQuery` 或 `useInfiniteQuery`) 获取和缓存数据
- UI 组件：使用 Card、Button、Link 等现有 UI 组件
- 时间线样式：参考 `ProductBusinessProcess.tsx` 的垂直时间线布局

### Previous Story Intelligence

**Story 3.5 学习点（具体代码模式）：**
- **SQL 查询模式：** 使用 JOIN companies、products、users 和 file_attachments 表
  - **注意差异：** Story 3.5 的 WHERE 子句包含 `pci.product_id = $2`，本 Story 不需要此条件
- **错误处理模式：** 验证客户是否存在，处理权限检查失败：
  ```typescript
  const customerCheck = await this.pgPool.query(
    'SELECT id, customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
    [customerId]
  );
  if (customerCheck.rows.length === 0) {
    throw new NotFoundException('客户不存在');
  }
  const customerType = customerCheck.rows[0].customer_type;
  if (customerTypeFilter && customerType !== customerTypeFilter) {
    throw new ForbiddenException('您没有权限查看该客户的互动历史');
  }
  ```
- **React Query 缓存配置：** 使用 `useQuery` 或 `useInfiniteQuery`，设置适当的缓存键和失效策略
- **附件处理：** 使用 `json_agg` 聚合附件，前端解析 JSON 数组
- **Creator 信息处理：** 使用 LEFT JOIN users 表获取创建者 email、first_name、last_name
- **互动类型映射：** **必须完全复用** Story 3.5 的 `INTERACTION_TYPE_LABELS` 和 `getInteractionTypeColor` 函数（见 Task 3 具体实现）
- **附件点击处理：** 复用 Story 3.5 的 `handleAttachmentClick` 模式

**Story 2.6 学习点（时间线视图）：**
- **时间线布局：** 使用垂直时间线，带圆点和连接线（见 Task 3 的时间线布局结构）
  - 参考 `ProductBusinessProcess.tsx` 的 `StageCard` 组件：使用 `flex items-start gap-monday-4` 布局
  - 时间线圆点：`w-monday-10 h-monday-10 rounded-full`，使用不同颜色表示不同状态
  - 连接线：`w-0.5 h-full min-h-monday-8 bg-gray-300`，只在非最后一项时显示
- **时间标记：** 使用 `getTimeLabel` 函数格式化时间标记（见 Task 3 的时间标签格式化函数）
- **交互设计：** 点击记录查看详情，使用模态框或跳转详情页
- **时间线组件结构：** 参考 `ProductBusinessProcess.tsx` 的 `StageCard` 组件结构

**Story 3.4 学习点：**
- 客户验证模式（验证客户是否存在和类型）
- 客户类型权限检查模式
- 前端组件集成到 CustomerDetailPanel 的模式

### Implementation Details

**SQL 查询示例（完整实现）：**
```typescript
// 在服务层实现
// 1. 计算时间范围起始日期
let dateRangeStart: Date | null = null;
if (dateRange === 'week') {
  dateRangeStart = new Date();
  dateRangeStart.setDate(dateRangeStart.getDate() - 7);
} else if (dateRange === 'month') {
  dateRangeStart = new Date();
  dateRangeStart.setDate(dateRangeStart.getDate() - 30);
} else if (dateRange === 'year') {
  dateRangeStart = new Date();
  dateRangeStart.setDate(dateRangeStart.getDate() - 365);
}

// 2. 确定排序方向（不能参数化，必须使用字符串插值）
const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

// 3. 构建 SQL 查询（注意：ORDER BY 使用字符串插值，不是参数）
const query = `
  SELECT 
    pci.id,
    pci.interaction_type,
    pci.interaction_date,
    pci.description,
    pci.status,
    pci.additional_info,
    pci.created_at,
    pci.created_by,
    p.id as product_id,
    p.name as product_name,
    p.hs_code as product_hs_code,
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
  INNER JOIN companies c ON c.id = pci.customer_id
  LEFT JOIN products p ON p.id = pci.product_id AND p.deleted_at IS NULL
  LEFT JOIN users u ON u.id = pci.created_by
  LEFT JOIN file_attachments fa ON fa.interaction_id = pci.id AND fa.deleted_at IS NULL
  WHERE pci.customer_id = $1 
    AND pci.deleted_at IS NULL
    AND c.deleted_at IS NULL
    AND ($2::text IS NULL OR c.customer_type = $2)  -- 角色过滤（$2 为 customerTypeFilter）
    AND ($3::timestamp IS NULL OR pci.interaction_date >= $3)  -- 时间范围筛选（$3 为 dateRangeStart）
  GROUP BY pci.id, pci.interaction_type, pci.interaction_date, pci.description, 
           pci.status, pci.additional_info, pci.created_at, pci.created_by,
           p.id, p.name, p.hs_code,
           u.email, u.first_name, u.last_name
  ORDER BY pci.interaction_date ${orderDirection}  -- 使用字符串插值，不是参数
  LIMIT $4 OFFSET $5
`;

// 4. 执行查询
const result = await this.pgPool.query(query, [
  customerId,
  customerTypeFilter,
  dateRangeStart,
  limit,
  offset,
]);
```

**性能优化：**
- 确保索引 `idx_interactions_customer` 包含 `interaction_date` 字段以优化时间范围查询
- 如果查询性能不足，考虑添加复合索引 `(customer_id, interaction_date, deleted_at)`
- 使用 `EXPLAIN ANALYZE` 验证查询计划

**前端组件结构：**
```tsx
interface CustomerTimelineProps {
  customerId: string;
}

interface TimelineInteraction {
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
  product?: {
    id: string;
    name: string;
    hsCode: string;
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

// 时间标签格式化函数（见 Task 3 实现）
const getTimeLabel = (date: Date): string => { /* ... */ };

// 互动类型映射（必须与 Story 3.5 完全一致）
const INTERACTION_TYPE_LABELS: Record<string, string> = { /* ... */ };
const getInteractionTypeColor = (type: string): string => { /* ... */ };
```

**API 端点：**
- `GET /api/customers/:customerId/timeline?page=1&limit=50&sortOrder=desc&dateRange=all`
- 返回：`{ interactions: CustomerTimelineInteractionDto[]; total: number }`

### Testing Standards

- **后端测试**: 使用 Jest，测试服务层和控制器层
- **前端测试**: 使用 Vitest + React Testing Library，测试组件渲染和交互
- **集成测试**: 验证 API 端点和前端组件的集成

### Project Structure Notes

- 后端服务：`fenghua-backend/src/companies/customer-timeline.service.ts`
- 后端控制器：`fenghua-backend/src/companies/customer-timeline.controller.ts`
- 后端 DTO：`fenghua-backend/src/companies/dto/customer-timeline.dto.ts`
- 前端组件：`fenghua-frontend/src/customers/components/CustomerTimeline.tsx`
- 前端集成：`fenghua-frontend/src/customers/components/CustomerDetailPanel.tsx`

### References

- [Source: _bmad-output/epics.md#Story-3.6] - Story 3.6 的原始需求
- [Source: _bmad-output/implementation-artifacts/stories/3-5-customer-product-interaction-history.md] - Story 3.5 的实现参考
- [Source: _bmad-output/implementation-artifacts/stories/2-6-product-business-process-view.md] - Story 2.6 的时间线视图参考
- [Source: fenghua-backend/src/companies/customer-product-interaction-history.service.ts] - 客户产品互动历史服务的实现参考
- [Source: fenghua-frontend/src/products/components/ProductBusinessProcess.tsx] - 产品业务流程时间线组件的实现参考

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

- `fenghua-backend/src/companies/dto/customer-timeline.dto.ts` - **NEW** - DTOs for customer timeline
- `fenghua-backend/src/companies/customer-timeline.service.ts` - **NEW** - Backend service for customer timeline
- `fenghua-backend/src/companies/customer-timeline.controller.ts` - **NEW** - Backend controller for customer timeline
- `fenghua-backend/src/companies/customer-timeline.service.spec.ts` - **NEW** - Unit tests for backend service
- `fenghua-backend/src/companies/companies.module.ts` - **MODIFY** - Registered new service and controller
- `fenghua-frontend/src/customers/components/CustomerTimeline.tsx` - **NEW** - Frontend component for customer timeline
- `fenghua-frontend/src/customers/components/CustomerTimeline.test.tsx` - **NEW** - Unit tests for frontend component
- `fenghua-frontend/src/customers/components/CustomerDetailPanel.tsx` - **MODIFY** - Integrated CustomerTimeline component

### Change Log

**2025-01-03: Initial Implementation**
- Created backend service, controller, and DTOs for customer timeline
- Implemented role-based filtering, sorting, date range filtering, and pagination
- Created frontend CustomerTimeline component with timeline layout
- Integrated component into CustomerDetailPanel
- Added comprehensive unit tests (backend: 13 tests, frontend: 10 tests)
- All tests passing

**2025-01-03: Code Review Fixes**
- Fixed Issue 1: Updated all task statuses to [x] in story file
- Fixed Issue 2: Implemented AC5 - Added interaction detail modal with click functionality
- Fixed Issue 3: Added complete File List to Dev Agent Record
- Fixed Issue 4: Documented pagination decision (virtual scroll can be added later if needed)
- Fixed Issue 5: Used title variable in filters card header
- Fixed Issue 6: Added JSDoc comments to all functions and components
- Fixed Issue 7: Added SQL ORDER BY parameter validation in service layer
- Fixed Issue 8: Updated story status to "done"
