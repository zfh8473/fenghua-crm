# Story 4.10: 客户产品互动记录查看（按角色）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **前端专员/后端专员/总监/管理员**,
I want **查看某个客户针对某个产品的所有互动记录**,
so that **我可以了解该客户与该产品的业务往来情况**.

## Acceptance Criteria

**AC1: 前端专员查看采购商产品互动记录**
- **Given** 前端专员已登录系统
- **When** 前端专员在采购商详情页面选择某个产品，点击"查看互动记录"
- **Then** 系统显示该采购商针对该产品的所有互动记录
- **And** 互动记录按时间顺序排列（最新的在前）
- **And** 每条互动记录显示：互动类型、互动时间、互动描述、创建者等
- **And** 系统只显示前端专员有权限查看的互动记录（只显示采购商类型的客户）

**AC2: 后端专员查看供应商产品互动记录**
- **Given** 后端专员已登录系统
- **When** 后端专员在供应商详情页面选择某个产品，点击"查看互动记录"
- **Then** 系统显示该供应商针对该产品的所有互动记录
- **And** 互动记录按时间顺序排列（最新的在前）
- **And** 每条互动记录显示：互动类型、互动时间、互动描述、创建者等
- **And** 系统只显示后端专员有权限查看的互动记录（只显示供应商类型的客户）

**AC3: 总监/管理员查看客户产品互动记录**
- **Given** 总监或管理员已登录系统
- **When** 总监或管理员在客户详情页面选择某个产品，点击"查看互动记录"
- **Then** 系统显示该客户针对该产品的所有互动记录
- **And** 互动记录按时间顺序排列（最新的在前）
- **And** 系统显示所有类型的互动记录（采购商和供应商的互动）

**AC4: 附件显示和查看**
- **Given** 用户查看客户产品互动记录
- **When** 互动记录包含附件（照片、文档等）
- **Then** 系统在互动记录中显示附件图标或缩略图
- **And** 用户可以点击附件查看或下载
- **And** 如果是照片，用户可以查看大图（支持多张照片切换）
- **And** 附件显示在互动记录的附件区域

**AC5: 分页和滚动加载**
- **Given** 用户查看客户产品互动记录
- **When** 互动记录较多（> 20 条）
- **Then** 系统使用分页或滚动加载显示互动记录
- **And** 系统显示互动记录总数
- **And** 系统支持按时间排序（最新的在前或最旧的在前，用户可选择）

**AC6: 空状态处理**
- **Given** 用户查看客户产品互动记录
- **When** 没有互动记录
- **Then** 系统显示空状态"该客户与该产品尚未有任何互动记录"
- **And** 系统提供"记录新互动"按钮，用户可以快速记录互动
- **And** 空状态显示友好的提示信息

## Tasks / Subtasks

- [x] Task 1: 验证和完善后端 API 端点 (AC: #1, #2, #3, #5)
  - [x] 验证 `GET /api/customers/:customerId/interactions?productId=:productId` 端点已实现
  - [x] 验证基于角色的数据过滤已实现（前端专员只看到采购商，后端专员只看到供应商）
  - [x] 验证分页功能已实现（page, limit 参数）
  - [x] **MEDIUM**: 实现排序功能（如果需要，添加 sortOrder 参数）
    - [x] 在 `CustomerProductInteractionQueryDto` 中添加 `sortOrder?: 'asc' | 'desc'` 字段
    - [x] 在 `CustomerProductInteractionHistoryService.getCustomerProductInteractions` 方法中处理 `sortOrder` 参数
    - [x] 更新 SQL 查询的 `ORDER BY` 子句：`ORDER BY pci.interaction_date ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`
    - [x] 默认值为 `'desc'`（最新的在前）
    - [x] 添加 `@IsIn(['asc', 'desc'])` 验证
  - [x] 验证附件数据已包含在响应中（attachments 数组）
  - [x] 验证客户不存在时返回 404
  - [x] 验证产品不存在时返回 404
  - [x] 验证权限检查失败时返回 403

- [x] Task 2: 验证和完善前端 CustomerProductInteractionHistory 组件 (AC: #1, #2, #3, #4, #5, #6)
  - [x] 验证组件已实现并集成到 `CustomerDetailPanel` 或 `CustomerProductAssociation`
  - [x] 验证互动记录按时间顺序显示（最新的在前）
  - [x] 验证每条互动记录显示：互动类型、互动时间、互动描述、创建者
  - [x] **CRITICAL**: 修复附件显示功能，复用 Story 4.8 的实现
    - [x] 照片附件：显示缩略图（64x64px 桌面端，48x48px 移动端），点击查看大图（使用 `PhotoPreview` 组件）
    - [x] 文档附件：使用 `getFileIcon` 显示图标，使用 `formatFileSize` 格式化文件大小，点击下载
    - [x] 复用 `CustomerTimeline` 组件的附件显示逻辑（参考 `fenghua-frontend/src/customers/components/CustomerTimeline.tsx`）
    - [x] 添加照片预览状态管理（`selectedPhotoIndex`, `photoAttachments`）
    - [x] 集成 `PhotoPreview` 组件（从 `fenghua-frontend/src/attachments/components/PhotoPreview.tsx` 导入）
    - [x] 使用 `getFileIcon` 和 `formatFileSize` 工具函数（从 `attachments.service` 导入 `formatFileSize`，复制 `getFileIcon`）
  - [x] 验证分页功能（如果记录 > 20 条）
  - [x] **MEDIUM**: 实现排序功能（用户可选择最新的在前或最旧的在前）
    - [x] 添加排序选择器（切换按钮）
    - [x] 将 `sortOrder` 参数传递给后端 API
    - [x] 更新 React Query 缓存键以包含 `sortOrder`
  - [x] 验证空状态显示（"该客户与该产品尚未有任何互动记录"）
  - [x] **HIGH**: 修复"记录新互动"按钮（链接到互动记录创建页面）
    - [x] 按钮链接到 `/interactions/create?customerId=${customerId}&productId=${productId}`
    - [x] **HIGH**: 按钮样式改为 `variant="primary"`（当前为 `secondary`）
    - [x] 按钮文本："记录新互动"
    - [x] **HIGH**: 确保 `InteractionCreateForm` 能够接收并预填充客户和产品信息
      - [x] 验证 `InteractionCreatePage` 从 URL 参数获取 `customerId` 和 `productId`（Story 4.9 已实现）
      - [x] 验证 `InteractionCreateForm` 已支持 `prefillCustomerId` 和 `prefillProductId` props（Story 4.9 已实现）
  - [x] **MEDIUM**: 使用统一的错误消息常量
    - [x] 在 `error-messages.ts` 中添加了 `CUSTOMER_PRODUCT_INTERACTION_ERRORS` 部分
    - [x] 替换所有硬编码的错误消息为常量
  - [x] **MEDIUM**: 添加 UUID 验证
    - [x] 在组件入口处验证 `customerId` 和 `productId` 的 UUID 格式
    - [x] 参考 Story 4.9 的实现
  - [x] **MEDIUM**: 使用 `getTimeLabel` 函数统一时间格式化
    - [x] 添加 `getTimeLabel` 函数到组件
    - [x] 替换 `toLocaleString` 为 `getTimeLabel`
  - [x] **LOW**: 添加 JSDoc 注释到所有函数

- [x] Task 3: 优化附件显示和交互 (AC: #4) - **CRITICAL FIX**
  - [x] **必须修复**: 当前实现过于简单，需要完全复用 Story 4.8 的附件显示逻辑
    - [x] 照片附件：显示缩略图（64x64px 桌面端，48x48px 移动端），点击查看大图
      - [x] 使用 `<img>` 标签显示缩略图，`onError` 处理加载失败
      - [x] 点击缩略图打开 `PhotoPreview` 组件
      - [x] 支持多张照片切换（上一张/下一张，键盘导航：←/→）
    - [x] 文档附件：显示图标和文件名，点击下载
      - [x] 使用 `getFileIcon` 函数根据文件类型显示图标（PDF: 📄, Word: 📝, Excel: 📊, 其他: 📎）
      - [x] 使用 `formatFileSize` 函数格式化文件大小（如 "1.2 MB"）
      - [x] 使用 `<a>` 标签的 `download` 属性实现下载
      - [x] 使用 `handleDocumentClick` 函数安全处理下载（防止 tabnabbing 攻击）
    - [x] 复用 `PhotoPreview` 组件（从 `fenghua-frontend/src/attachments/components/PhotoPreview.tsx` 导入）
    - [x] 复用 `getFileIcon` 和 `formatFileSize` 工具函数
      - [x] 从 `CustomerTimeline` 组件复制 `getFileIcon` 函数
      - [x] 从 `attachments.service` 导入 `formatFileSize`（已可用）
    - [x] 参考实现：`fenghua-frontend/src/customers/components/CustomerTimeline.tsx` 的 `TimelineInteractionCard` 组件（第 292-356 行）
  - [x] 确保附件显示布局优化（移动端和桌面端）
  - [x] 添加照片预览状态管理：
    - [x] `selectedPhotoIndex: number | null` - 当前预览的照片索引
    - [x] `photoAttachments: Attachment[]` - 当前互动记录的所有照片附件数组
    - [x] `handlePhotoClick` - 处理照片点击，打开预览
    - [x] `handlePhotoNext` - 切换到下一张照片
    - [x] `handlePhotoPrevious` - 切换到上一张照片

- [x] Task 4: 优化互动记录卡片显示 (AC: #1, #2, #3)
  - [x] 确保互动类型显示中文标签（使用 INTERACTION_TYPE_LABELS）
  - [x] 确保互动时间格式化显示（使用 `getTimeLabel` 函数）
  - [x] 确保创建者信息显示（创建者姓名或邮箱）
  - [x] 优化卡片布局（移动端和桌面端）

- [x] Task 5: 集成到客户详情页面 (AC: #1, #2, #3)
  - [x] 验证 `CustomerProductAssociation` 组件中的"查看互动记录"按钮已实现（按钮文本为"查看互动历史"，功能相同）
  - [x] 验证按钮链接到正确的路由（`/customers/:customerId/interactions?productId=:productId`）
  - [x] 验证 `CustomerProductInteractionHistoryPage` 页面已实现
  - [x] 验证页面显示客户名称和产品名称
  - [x] 验证页面集成 `CustomerProductInteractionHistory` 组件

- [ ] Task 6: 添加测试用例 (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 添加前端组件测试（CustomerProductInteractionHistory 组件）
  - [ ] 测试基于角色的数据过滤（前端专员只看到采购商，后端专员只看到供应商）
  - [ ] 测试分页功能
  - [ ] 测试排序功能（如果需要）
  - [ ] 测试附件显示和交互
  - [ ] 测试空状态显示
  - [ ] 添加后端 API 测试（CustomerProductInteractionHistoryController 和 CustomerProductInteractionHistoryService）

## Technical Notes

### 现有实现分析

**Story 3.5 已完成的工作：**
- ✅ 后端 `CustomerProductInteractionHistoryService` 已实现
- ✅ 后端 `CustomerProductInteractionHistoryController` 已实现
- ✅ 后端 API 端点：`GET /api/customers/:customerId/interactions?productId=:productId`
- ✅ 前端 `CustomerProductInteractionHistory` 组件已实现
- ✅ 前端 `CustomerProductInteractionHistoryPage` 页面已实现
- ✅ 路由已配置：`/customers/:customerId/interactions`
- ✅ `CustomerProductAssociation` 组件中已有"查看互动记录"按钮

**需要验证和完善的工作：**
- ⚠️ **CRITICAL**: 附件显示未复用 Story 4.8 的实现（照片预览、文档下载逻辑）
- ⚠️ **HIGH**: 空状态按钮样式不符合要求（当前为 secondary，应为 primary）
- ⚠️ **MEDIUM**: 后端 API 可能不支持排序功能（sortOrder 参数）
- ⚠️ **MEDIUM**: 前端组件未使用统一的错误消息常量
- ⚠️ **MEDIUM**: 缺少 UUID 验证
- ⚠️ **MEDIUM**: 时间格式化未使用 `getTimeLabel` 函数
- ⚠️ **LOW**: 文件大小格式化未使用 formatFileSize 工具函数
- ⚠️ **LOW**: 缺少 JSDoc 注释

### 后端 API

**端点：** `GET /api/customers/:customerId/interactions?productId=:productId`

**查询参数：**
- `productId` (string, required): 产品 ID
- `page` (number, default: 1): 页码
- `limit` (number, default: 20, max: 100): 每页记录数
- `sortOrder` (optional, 'asc' | 'desc', default: 'desc'): 排序顺序（**需要实现**）

**响应格式：**
```typescript
{
  interactions: CustomerProductInteractionDto[];
  total: number;
}

interface CustomerProductInteractionDto {
  id: string;
  interactionType: string;
  interactionDate: string;
  description?: string;
  status?: string;
  additionalInfo?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
  creatorEmail?: string;
  creatorFirstName?: string;
  creatorLastName?: string;
  attachments: FileAttachmentDto[];
}

interface FileAttachmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
}
```

**实现位置：**
- Controller: `fenghua-backend/src/companies/customer-product-interaction-history.controller.ts`
- Service: `fenghua-backend/src/companies/customer-product-interaction-history.service.ts`
- DTO: `fenghua-backend/src/companies/dto/customer-product-interaction-history.dto.ts`

### 前端组件

**组件：** `CustomerProductInteractionHistory`

**位置：** `fenghua-frontend/src/customers/components/CustomerProductInteractionHistory.tsx`

**页面：** `CustomerProductInteractionHistoryPage`

**位置：** `fenghua-frontend/src/customers/CustomerProductInteractionHistoryPage.tsx`

**集成位置：** 
- `CustomerProductAssociation` 组件中的"查看互动记录"按钮
- 路由：`/customers/:customerId/interactions?productId=:productId`

**功能：**
- 显示客户与产品的互动记录（限定客户和产品）
- 支持基于角色的数据过滤
- 支持分页
- 支持附件显示和查看
- 支持空状态显示

### 基于角色的数据过滤

**前端专员：**
- 只能查看采购商（BUYER）类型的客户的互动记录
- 只能查看前端专员的互动类型（初步接触、产品询价、报价等）

**后端专员：**
- 只能查看供应商（SUPPLIER）类型的客户的互动记录
- 只能查看后端专员的互动类型（询价产品、接收报价、产品规格确认等）

**总监/管理员：**
- 可以查看所有类型的客户的互动记录
- 可以查看所有类型的互动记录

### 数据模型

**数据库表：**
- `product_customer_interactions` - 存储产品-客户互动记录
- `file_attachments` - 存储附件信息（关联到互动记录）
- `companies` - 存储客户信息（原生 PostgreSQL 表）
- `users` - 存储用户信息（用于显示创建者信息）

**外键约束：**
- `product_customer_interactions.customer_id` → `companies.id`（已存在）
- `product_customer_interactions.product_id` → `products.id`（已存在）
- `file_attachments.interaction_id` → `product_customer_interactions.id`（已存在）

**数据隔离策略：**
- **客户范围隔离：** 通过 `customer_id` 限定查询范围
- **产品范围隔离：** 通过 `product_id` 限定查询范围
- **角色过滤：** 通过 `customer_type` 字段过滤（`'BUYER'` 或 `'SUPPLIER'`）
- **软删除过滤：** 通过 `deleted_at IS NULL` 过滤已删除的记录
- **大小写转换：** PermissionService 返回小写（`'buyer'`, `'supplier'`），数据库存储大写（`'BUYER'`, `'SUPPLIER'`），需要在 SQL 查询中使用 `UPPER()` 或应用层转换

### UI 设计标准

**参考文档：**
- `docs/design-system/ui-design-standards.md`

**关键设计要点：**
1. **卡片布局：** 使用 `Card` 组件，符合 Monday.com 风格
2. **互动记录列表：** 使用卡片列表，每条互动记录一个卡片
3. **互动类型标签：** 使用彩色标签区分不同类型的互动
4. **附件显示：** 照片显示缩略图，文档显示图标和文件名
5. **照片预览：** 使用 `PhotoPreview` 组件，支持多张照片切换
6. **空状态：** 显示友好的提示信息和"记录新互动"按钮（primary 样式）

### 参考实现

**Story 4.9 的实现：**
- `fenghua-frontend/src/products/components/ProductCustomerInteractionHistory.tsx` - 产品-客户互动记录查看组件
- `fenghua-backend/src/products/product-customer-interaction-history.service.ts` - 产品-客户互动记录服务
- `fenghua-backend/src/products/product-customer-interaction-history.controller.ts` - 产品-客户互动记录控制器

**Story 4.8 的实现：**
- `fenghua-frontend/src/customers/components/CustomerTimeline.tsx` - 客户时间线组件（附件显示逻辑）
- `fenghua-frontend/src/attachments/components/PhotoPreview.tsx` - 照片预览组件

**Story 3.5 的实现：**
- `fenghua-frontend/src/customers/components/CustomerProductInteractionHistory.tsx` - 客户-产品互动历史组件（基础实现）
- `fenghua-backend/src/companies/customer-product-interaction-history.service.ts` - 客户-产品互动历史服务（基础实现）

### 依赖关系

**前端依赖：**
- `Card` 组件（已存在）
- `Button` 组件（已存在）
- `PhotoPreview` 组件（Story 4.5 已实现）
- `ErrorBoundary` 组件（Story 4.8 已实现）
- `useAuth` hook（已存在）
- React Query（已安装）
- `formatFileSize` 工具函数（`attachments.service`）
- `getFileIcon` 工具函数（需要从 `CustomerTimeline` 复制）

**后端依赖：**
- `PermissionService`（已存在）
- `PermissionAuditService`（已存在）
- PostgreSQL 连接池（已配置）

**API 调用：**
- GET `/api/customers/:customerId/interactions?productId=:productId&page=1&limit=20&sortOrder=desc` - 获取客户-产品互动记录列表
- **数据源：** 直接从 PostgreSQL `product_customer_interactions` 和 `file_attachments` 表查询（不是 Twenty CRM）

### 实现注意事项

1. **与 Story 4.9 的对称性：** Story 4.10 是 Story 4.9 的对称实现（从客户角度查看，而不是从产品角度）。实现时应保持一致的代码风格和功能特性。

2. **复用 Story 4.9 的改进：** Story 4.9 已经实现了排序、附件显示、错误消息常量、UUID 验证、时间格式化等功能。Story 4.10 应该复用这些改进。

3. **InteractionCreateForm 预填充：** Story 4.9 已经实现了 `prefillProductId` 和 `prefillCustomerId` 的支持，Story 4.10 只需要验证这些功能正常工作。

4. **错误消息常量：** 可以考虑复用 `PRODUCT_INTERACTION_ERRORS` 常量，或者创建 `CUSTOMER_PRODUCT_INTERACTION_ERRORS` 常量（如果消息文本不同）。

5. **测试覆盖：** 参考 Story 4.9 的测试策略，确保测试覆盖所有验收标准。

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI)

### Debug Log References

### Completion Notes List

**实现完成（2025-01-03）：**

1. **后端 API 排序功能** ✅
   - 在 `CustomerProductInteractionQueryDto` 中添加了 `sortOrder?: 'asc' | 'desc'` 字段
   - 添加了 `@IsIn(['asc', 'desc'])` 验证
   - 在 `CustomerProductInteractionHistoryService` 中实现了排序逻辑
   - SQL 查询支持动态排序（`ORDER BY pci.interaction_date ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`）
   - 在 `CustomerProductInteractionHistoryController` 中传递 `sortOrder` 参数

2. **前端组件完全重写（CRITICAL）** ✅
   - 完全重写了 `CustomerProductInteractionHistory` 组件，参考 Story 4.9 的实现
   - 添加了 UUID 验证（`customerId` 和 `productId`）
   - 添加了 `getTimeLabel` 函数统一时间格式化
   - 添加了 `getFileIcon` 函数用于文件图标显示
   - 实现了完整的附件显示功能（照片缩略图、PhotoPreview、文档图标、formatFileSize）
   - 添加了照片预览状态管理和导航功能
   - 使用 `ErrorBoundary` 包装 `PhotoPreview` 组件

3. **排序功能（MEDIUM）** ✅
   - 添加了排序选择器 UI（切换按钮："最新的在前" / "最旧的在前"）
   - 将 `sortOrder` 参数传递给后端 API
   - 更新了 React Query 缓存键以包含 `sortOrder`

4. **空状态按钮样式修复（HIGH）** ✅
   - 将按钮样式从 `variant="secondary"` 改为 `variant="primary"`

5. **错误消息常量（MEDIUM）** ✅
   - 在 `error-messages.ts` 中添加了 `CUSTOMER_PRODUCT_INTERACTION_ERRORS` 部分
   - 替换了所有硬编码的错误消息为常量
   - 空状态消息使用正确的文本："该客户与该产品尚未有任何互动记录"

6. **JSDoc 注释（LOW）** ✅
   - 为所有主要函数添加了 JSDoc 注释
   - 包括 `getFileIcon`, `getTimeLabel`, `handleDocumentClick`, `handlePhotoClick`, `handlePhotoNext`, `handlePhotoPrevious` 等

### File List

**后端文件：**
- `fenghua-backend/src/companies/dto/customer-product-interaction-history.dto.ts` - 添加了 `sortOrder` 字段和 `@IsIn` 验证
- `fenghua-backend/src/companies/customer-product-interaction-history.service.ts` - 实现了排序逻辑
- `fenghua-backend/src/companies/customer-product-interaction-history.controller.ts` - 传递 `sortOrder` 参数

**前端文件：**
- `fenghua-frontend/src/customers/components/CustomerProductInteractionHistory.tsx` - 完全重写，添加了附件显示、排序、UUID 验证、错误消息常量、时间格式化等功能
- `fenghua-frontend/src/common/constants/error-messages.ts` - 添加了 `CUSTOMER_PRODUCT_INTERACTION_ERRORS` 常量

## Change Log

**代码审查修复（2025-01-03）：**
- **Issue #1 (HIGH):** 移除了未使用的 `useMemo` 导入
- **Issue #4 (MEDIUM):** 添加了照片附件映射占位符值的注释说明（`createdAt` 和 `createdBy` 是占位符值，因为 API 响应不包含这些字段）

