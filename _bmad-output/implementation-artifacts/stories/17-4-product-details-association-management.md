# Story 17.4: 产品详情页关联管理界面

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **所有用户**,
I want **在产品详情页管理产品与客户的关联**,
So that **我可以添加、删除和查看产品的所有关联关系，包括有互动记录和无互动记录的关联**.

## Acceptance Criteria

1. **Given** 用户已登录系统并查看产品详情页
   **When** 用户查看"关联的客户"部分
   **Then** 系统显示"管理关联"按钮
   **And** 点击"管理关联"按钮后，打开全屏抽屉或弹窗
   **And** 抽屉/弹窗标题为"管理产品关联客户"

2. **Given** 用户在关联管理界面
   **When** 系统加载关联列表
   **Then** 左侧显示已关联的客户列表
   **And** 每个客户显示：
     - 客户名称
     - 客户类型（采购商/供应商）
     - 关联状态标签：
       - "有互动记录"（绿色）+ 互动数量徽章
       - "待互动"（灰色）
     - 删除按钮（仅当前用户创建的关联可以删除）
   **And** 客户列表支持搜索和过滤
   **And** 系统显示关联统计："共 10 个关联，其中 7 个有互动记录"

3. **Given** 用户在关联管理界面
   **When** 用户点击"添加关联"或搜索框
   **Then** 右侧显示搜索和添加区域
   **And** 搜索框支持输入客户名称或代码
   **And** 系统根据用户角色过滤客户类型：
     - 前端专员：只显示采购商
     - 后端专员：只显示供应商
     - 总监/管理员：显示所有客户
   **And** 搜索结果排除已关联的客户
   **And** 用户可以选择客户并点击"添加关联"

4. **Given** 用户添加关联
   **When** 用户选择客户并点击"添加关联"
   **Then** 系统调用 API 建立关联关系
   **And** 关联类型根据客户类型自动设置
   **And** 系统显示成功消息："关联已建立"
   **And** 关联列表自动刷新，新关联显示在列表中
   **And** 新关联显示为"待互动"状态

5. **Given** 用户删除关联
   **When** 用户点击客户的"删除"按钮
   **Then** 系统显示确认对话框："确定要删除此关联吗？"
   **And** 确认对话框提示："删除关联不会影响已有的互动记录"
   **And** 用户确认后，系统调用 API 删除关联（软删除）
   **And** 系统显示成功消息："关联已删除"
   **And** 关联列表自动刷新，删除的关联从列表中移除

6. **Given** 用户查看关联列表
   **When** 关联数量较多（> 10 个）
   **Then** 系统使用分页或滚动加载显示关联列表
   **And** 系统显示关联总数和当前页信息

7. **Given** 用户关闭关联管理界面
   **When** 用户点击"关闭"按钮或点击遮罩层
   **Then** 抽屉/弹窗关闭
   **And** 产品详情页的"关联的客户"部分自动刷新
   **And** 显示更新后的关联列表

## Tasks / Subtasks

- [x] Task 1: 创建关联管理抽屉/弹窗组件 (AC: #1, #7)
  - [ ] 创建 `products/components/ProductAssociationManagementModal.tsx` 组件
    - [ ] **UI 结构：**
      - [ ] 使用全屏或大尺寸弹窗（参考 `ProductDetailPanel` 中的图片模态框实现，第 267-308 行）
      - [ ] 弹窗包含：
        - [ ] 标题栏："管理产品关联客户" + 关闭按钮
        - [ ] 左侧：已关联客户列表（可滚动）
        - [ ] 右侧：添加关联区域（搜索框 + 搜索结果）
        - [ ] 底部：统计信息和关闭按钮
      - [ ] 使用 Tailwind CSS 实现响应式布局（移动端：单列，桌面端：双列）
    - [ ] **弹窗交互：**
      - [ ] 点击遮罩层关闭弹窗
      - [ ] 按 ESC 键关闭弹窗
      - [ ] 焦点陷阱（focus trap）：Tab 键在弹窗内循环
      - [ ] 关闭时恢复焦点到触发按钮
    - [ ] **Props：**
      - [ ] `productId: string` - 产品 ID
      - [ ] `isOpen: boolean` - 是否打开
      - [ ] `onClose: () => void` - 关闭回调
      - [ ] `onAssociationChange?: () => void` - 关联变化回调（用于刷新父组件）

- [x] Task 2: 实现关联列表显示 (AC: #2, #6)
  - [ ] 在 `ProductAssociationManagementModal` 中实现关联列表：
    - [ ] **数据获取：**
      - [ ] 使用 React Query 调用 `GET /api/products/:productId/associations`（参考 `ProductCustomerAssociation` 组件的实现，第 97-126 行）
      - [ ] 支持分页（`page`, `limit` 参数）
      - [ ] 使用 `ProductCustomerAssociationResponseDto` 类型（包含 `hasExplicitAssociation`, `associationType`, `interactionCount`, `createdBy`）
      - [ ] 使用缓存键：`['product-associations', productId, page, limit]`
      - [ ] 设置 `staleTime: 5 * 60 * 1000`（5 分钟缓存）
    - [ ] **错误处理：**
      - [ ] 使用 React Query 的 `error` 状态显示错误消息
      - [ ] 显示错误消息和重试按钮（参考 `ProductCustomerAssociation` 第 156-169 行）
      - [ ] 处理 403（权限不足）、404（产品不存在）、500（服务器错误）
    - [ ] **列表项显示：**
      - [ ] 客户名称（可点击，链接到 `/customers/:customerId/interactions`，客户互动历史页面）
      - [ ] 客户类型标签（采购商/供应商，参考 `ProductCustomerAssociation` 第 46-55 行）
      - [ ] 关联状态标签：
        - [ ] `interactionCount > 0`：显示"有互动记录"（绿色背景）+ 互动数量徽章
        - [ ] `interactionCount === 0`：显示"待互动"（灰色背景）
      - [ ] 删除按钮（仅当 `hasExplicitAssociation === true` 且 `createdBy === currentUser.id` 时显示）
    - [ ] **搜索和过滤（前端实现）：**
      - [ ] 搜索框：支持输入客户名称或代码（debounce 500ms，在前端使用 `useMemo` 过滤 `customers` 数组）
      - [ ] 过滤：根据 `interactionCount` 过滤（全部/有互动/待互动），使用 `useMemo` 在前端过滤
      - [ ] 注意：搜索和过滤都在前端实现，不调用后端 API
    - [ ] **统计信息：**
      - [ ] 显示总关联数：`total`（所有页面的总数）
      - [ ] 显示当前页有互动记录的关联数：`filteredCustomers.filter(c => c.interactionCount > 0).length`（仅当前页）
      - [ ] 显示格式："共 {total} 个关联，当前页 {filteredCustomers.length} 个，其中 {withInteractions} 个有互动记录"
      - [ ] 注意：由于分页，有互动记录的统计只针对当前页的数据
    - [ ] **分页：**
      - [ ] 当 `total > limit` 时显示分页控件（参考 `ProductCustomerAssociation` 第 237-263 行）
      - [ ] 显示当前页和总页数

- [x] Task 3: 实现添加关联功能 (AC: #3, #4)
  - [ ] 在 `ProductAssociationManagementModal` 中实现添加关联区域：
    - [ ] **搜索客户：**
      - [ ] 使用 `CustomerMultiSelect` 组件（参考 `ProductCreateForm` 的实现）
      - [ ] 搜索框支持输入客户名称或代码
      - [ ] 根据用户角色过滤客户类型（参考 `InteractionCreateForm` 第 247-278 行的客户搜索实现）
      - [ ] 排除已关联的客户：
        - [ ] 从关联列表中获取已关联的客户 ID：`associatedCustomerIds = customers.map(c => c.id)`
        - [ ] 在 `CustomerMultiSelect` 组件中，如果组件不支持 `excludeIds` prop，则在搜索结果中过滤掉已关联的客户
        - [ ] 或者在 `CustomerMultiSelect` 组件中添加 `excludeIds?: string[]` prop，并在搜索时排除这些 ID
    - [ ] **添加关联逻辑：**
      - [ ] 用户选择客户后，点击"添加关联"按钮
      - [ ] 调用 `POST /api/products/:productId/associations`（参考 `products.service.ts` 中的 `createProductCustomerAssociation` 方法，如果不存在则创建）
      - [ ] 请求体：`{ customerId: string, associationType: AssociationType }`
      - [ ] 关联类型根据客户类型自动设置：
        - [ ] `customerType === 'BUYER'` → `'POTENTIAL_BUYER'`
        - [ ] `customerType === 'SUPPLIER'` → `'POTENTIAL_SUPPLIER'`
      - [ ] 使用 `useMutation` 处理添加操作
      - [ ] 成功后：
        - [ ] 显示成功消息："关联已建立"
        - [ ] 刷新关联列表（`queryClient.invalidateQueries(['product-associations', productId])`）
        - [ ] 清空搜索框和已选客户
        - [ ] 调用 `onAssociationChange` 回调（如果提供）
    - [ ] **错误处理：**
      - [ ] 处理 400（关联已存在）、403（权限不足）、404（客户不存在）、500（服务器错误）
      - [ ] 显示用户友好的错误消息（使用统一的错误消息常量）

- [x] Task 4: 实现删除关联功能 (AC: #5)
  - [ ] 在 `ProductAssociationManagementModal` 中实现删除关联：
    - [ ] **删除按钮：**
      - [ ] 仅当 `hasExplicitAssociation === true` 时显示删除按钮
      - [ ] 仅当关联由当前用户创建时显示删除按钮：
        - [ ] 使用 `association.createdBy === currentUser.id` 判断（后端 API 已返回 `createdBy` 字段）
        - [ ] 如果 `createdBy` 不存在或为空，则不显示删除按钮
      - [ ] 删除按钮使用危险样式（红色，参考 `ProductDetailPanel` 第 252-262 行）
    - [ ] **确认对话框：**
      - [ ] 点击删除按钮时，显示确认对话框（使用 `window.confirm`，代码库中没有自定义对话框组件）
      - [ ] 对话框消息：`ASSOCIATION_DELETE_CONFIRM + '\n' + ASSOCIATION_DELETE_CONFIRM_MESSAGE`
      - [ ] 如果用户点击"确认"，继续删除操作；如果点击"取消"，取消删除
    - [ ] **删除逻辑：**
      - [ ] 用户确认后，调用 `DELETE /api/products/:productId/associations/:customerId`（参考 `products.service.ts` 中的 `deleteProductCustomerAssociation` 方法，如果不存在则创建）
      - [ ] 使用 `useMutation` 处理删除操作
      - [ ] 成功后：
        - [ ] 显示成功消息："关联已删除"
        - [ ] 刷新关联列表（`queryClient.invalidateQueries(['product-associations', productId])`）
        - [ ] 调用 `onAssociationChange` 回调（如果提供）
    - [ ] **错误处理：**
      - [ ] 处理 403（权限不足）、404（关联不存在）、500（服务器错误）
      - [ ] 显示用户友好的错误消息（使用统一的错误消息常量）

- [x] Task 5: 集成到产品详情页 (AC: #1, #7)
  - [x] 修改 `products/components/ProductCustomerAssociation.tsx`：
    - [x] 添加"管理关联"按钮（显示在标题旁边，参考 `ProductDetailPanel` 第 192-194 行的标题样式）
    - [x] 按钮点击时打开 `ProductAssociationManagementModal`
    - [x] 管理关联后，刷新关联列表：
      - [x] 使用 `queryClient.invalidateQueries(['product-associations', productId])` 刷新管理弹窗的关联列表
      - [x] 同时使用 `queryClient.invalidateQueries(['product-customers', productId])` 刷新 `ProductCustomerAssociation` 组件的列表
  - [x] 修改 `products/components/ProductDetailPanel.tsx`：
    - [x] 确保 `ProductCustomerAssociation` 组件可以接收 `onAssociationChange` 回调（如果需要）
  - [ ] **重构为摘要按钮模式（修复实现偏差）** (AC: #1, #7)
    - [ ] 修改 `products/components/ProductCustomerAssociation.tsx`：
      - [ ] 移除直接显示列表的逻辑（当前第 190-266 行）
      - [ ] 改为显示摘要卡片：
        - [ ] 标题："关联的客户"
        - [ ] 按钮："查看关联客户 (X)"，显示总关联数
        - [ ] 统计信息（可选，如果 API 支持）：
          - [ ] 采购商数量（仅总监/管理员显示）
          - [ ] 供应商数量（仅总监/管理员显示）
          - [ ] 有互动记录数量
      - [ ] 点击按钮打开 `ProductAssociationManagementModal`（已有实现）
      - [ ] 在详情面板中只显示摘要，不显示完整列表
    - [ ] **数据获取：**
      - [ ] 使用轻量级 API 调用获取关联统计（如果后端支持 `GET /api/products/:id/associations/summary`）
      - [ ] 或者使用现有 API 的第一页数据计算统计（不够准确但可用）
      - [ ] 使用 React Query 缓存统计信息（`staleTime: 5 * 60 * 1000`）
    - [ ] **错误处理：**
      - [ ] 如果 API 调用失败，显示错误消息和重试按钮
      - [ ] 如果无法获取统计，至少显示"查看关联客户"按钮（不显示数量）

- [x] Task 6: 创建前端服务方法 (AC: #3, #4, #5)
  - [ ] 在 `products/products.service.ts` 中添加关联管理方法：
    - [ ] `getProductAssociations(productId: string, page?: number, limit?: number): Promise<{ customers: ProductCustomerAssociationResponseDto[]; total: number }>`
      - [ ] 调用 `GET /api/products/:productId/associations`
      - [ ] 查询参数：`page`, `limit`
      - [ ] 使用 JWT token 进行认证（使用现有的 `getAuthToken` 方法）
      - [ ] 实现错误处理（400, 403, 404, 500）
    - [ ] `createProductCustomerAssociation(productId: string, customerId: string, associationType: AssociationType): Promise<void>`
      - [ ] 调用 `POST /api/products/:productId/associations`
      - [ ] 请求体：`{ customerId: string, associationType: AssociationType }`
      - [ ] 使用 JWT token 进行认证
      - [ ] 实现错误处理（400, 403, 404, 500）
    - [ ] `deleteProductCustomerAssociation(productId: string, customerId: string): Promise<void>`
      - [ ] 调用 `DELETE /api/products/:productId/associations/:customerId`
      - [ ] 使用 JWT token 进行认证
      - [ ] 实现错误处理（403, 404, 500）

- [x] Task 7: 添加类型定义 (AC: #2, #3, #4, #5)
  - [ ] 在 `products/types/` 目录中创建或更新类型定义：
    - [ ] `ProductCustomerAssociationResponseDto` 类型（如果不存在）：
      ```typescript
      interface ProductCustomerAssociationResponseDto {
        id: string;
        name: string;
        customerType: 'SUPPLIER' | 'BUYER';
        interactionCount: number;
        associationType?: 'POTENTIAL_SUPPLIER' | 'POTENTIAL_BUYER';
        hasExplicitAssociation: boolean;
        createdBy?: string; // ID of the user who created the explicit association (if exists)
      }
      ```
    - [ ] 从 `products/types/association-types.ts` 导入 `AssociationType`（如果已存在）

- [x] Task 8: 添加错误消息常量 (AC: #3, #4, #5)
  - [ ] 在 `common/constants/error-messages.ts` 中添加关联管理相关的错误消息：
    - [ ] `export const ASSOCIATION_CREATE_SUCCESS = '关联已建立'`
    - [ ] `export const ASSOCIATION_DELETE_SUCCESS = '关联已删除'`
    - [ ] `export const ASSOCIATION_CREATE_FAILED = (error: string) => \`创建关联失败：${error}\``（如果尚未存在）
    - [ ] `export const ASSOCIATION_DELETE_FAILED = (error: string) => \`删除关联失败：${error}\``
    - [ ] `export const ASSOCIATION_ALREADY_EXISTS = '该关联关系已存在'`
    - [ ] `export const ASSOCIATION_NOT_FOUND = '关联关系不存在'`
    - [ ] `export const ASSOCIATION_DELETE_CONFIRM = '确定要删除此关联吗？'`
    - [ ] `export const ASSOCIATION_DELETE_CONFIRM_MESSAGE = '删除关联不会影响已有的互动记录'`

- [x] Task 9: 更新 UI 和样式 (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] 确保关联管理弹窗使用统一的样式系统：
    - [ ] 使用 `Card` 组件（参考 `ProductDetailPanel` 的实现）
    - [ ] 使用 `Button` 组件（参考 `ProductDetailPanel` 的实现）
    - [ ] 使用 Tailwind CSS 的 `bg-monday-surface`, `border-gray-200`, `shadow-monday-lg` 等类
  - [ ] **实现响应式设计（移动端适配）：**
    - [ ] 弹窗在移动端（`max-width: 767px`）：
      - [ ] 使用全屏模式（`fixed inset-0`）
      - [ ] 左侧和右侧区域垂直堆叠（单列布局）
      - [ ] 搜索框和按钮使用全宽（`w-full`）
    - [ ] 弹窗在桌面端（`min-width: 768px`）：
      - [ ] 使用双列布局（左侧：关联列表，右侧：添加区域）
      - [ ] 弹窗最大宽度：`max-w-4xl` 或 `max-w-6xl`
  - [ ] **状态标签样式：**
    - [ ] "有互动记录"：绿色背景（`bg-primary-green/10 text-primary-green`）
    - [ ] "待互动"：灰色背景（`bg-gray-100 text-monday-text-secondary`）
    - [ ] 互动数量徽章：小号字体（`text-monday-xs`），圆角（`rounded-full`），背景色与标签一致
  - [ ] **加载状态：**
    - [ ] 关联列表加载时显示加载指示器（参考 `ProductCustomerAssociation` 第 145-154 行）
    - [ ] 添加关联时显示加载状态（使用 `isSubmitting` 状态）
    - [ ] 删除关联时显示加载状态（使用 `isDeleting` 状态）

- [ ] Task 10: 修复 API 路由问题 (Bug Fix)
  - [ ] **问题描述：**
    - [ ] 前端调用 `GET /api/products/:id/associations` 时返回 404 错误
    - [ ] 错误信息：`Cannot GET /products/7c7378f5-9e94-465e-bec7-f2a71d528e61/associations`
  - [ ] **检查后端路由注册：**
    - [ ] 确认 `ProductCustomerAssociationManagementController` 在 `ProductsModule` 中正确注册
    - [ ] 检查路由顺序：确保 `ProductCustomerAssociationManagementController` 的路由在 `ProductsController` 之前注册（避免路由冲突）
    - [ ] 验证路由路径：`@Get(':id/associations')` 是否正确
  - [ ] **检查模块导入：**
    - [ ] 确认 `ProductCustomerAssociationManagementModule` 已正确导入到 `ProductsModule`
    - [ ] 确认所有依赖服务（`ProductCustomerAssociationManagementService`, `AuthService`, `PermissionService` 等）已正确注入
  - [ ] **测试 API 端点：**
    - [ ] 使用 Postman 或 curl 测试 `GET /api/products/:id/associations` 端点
    - [ ] 验证 JWT token 认证是否正常工作
    - [ ] 验证权限检查是否正常工作
    - [ ] 验证返回数据格式是否正确
  - [ ] **修复方案：**
    - [ ] 如果路由顺序问题：调整 `ProductsModule` 中 controllers 数组的顺序
    - [ ] 如果模块导入问题：检查并修复模块导入
    - [ ] 如果路由路径问题：检查 controller 装饰器和路由路径
    - [ ] 如果认证问题：检查 JWT guard 和 token 验证逻辑

- [ ] Task 11: 添加测试用例 (AC: #1, #2, #3, #4, #5, #6, #7) - 可选任务
  - [ ] 添加 `ProductAssociationManagementModal.test.tsx` 测试：
    - [ ] **弹窗交互测试：**
      - [ ] 测试打开/关闭弹窗
      - [ ] 测试点击遮罩层关闭
      - [ ] 测试 ESC 键关闭
      - [ ] 测试焦点陷阱
    - [ ] **关联列表测试：**
      - [ ] 测试加载关联列表
      - [ ] 测试显示关联状态标签（有互动/待互动）
      - [ ] 测试搜索和过滤
      - [ ] 测试分页
    - [ ] **添加关联测试：**
      - [ ] 测试搜索客户
      - [ ] 测试添加关联成功
      - [ ] 测试添加关联失败（关联已存在、权限不足等）
    - [ ] **删除关联测试：**
      - [ ] 测试删除确认对话框
      - [ ] 测试删除关联成功
      - [ ] 测试删除关联失败（权限不足、关联不存在等）
    - [ ] **权限测试：**
      - [ ] 测试仅显示当前用户创建的关联的删除按钮
      - [ ] 测试根据用户角色过滤客户类型

## Implementation Notes

- **后端 API 参考：**
  - `GET /api/products/:id/associations` - 获取产品关联（合并显式关联和互动记录）
  - `POST /api/products/:id/associations` - 创建关联
  - `DELETE /api/products/:id/associations/:customerId` - 删除关联
  - 返回数据包含 `hasExplicitAssociation` 和 `interactionCount` 字段

- **UI 设计参考：**
  - 参考 `ProductDetailPanel` 中的图片模态框实现（第 267-308 行）
  - 参考 `ProductCustomerAssociation` 组件的列表显示（第 190-266 行）
  - 参考 `CustomerMultiSelect` 组件的搜索实现（用于添加关联）

- **数据流：**
  1. 用户点击"管理关联"按钮
  2. 打开 `ProductAssociationManagementModal`
  3. 加载关联列表（`GET /api/products/:id/associations`）
  4. 用户添加/删除关联
  5. 刷新关联列表
  6. 关闭弹窗后，刷新 `ProductCustomerAssociation` 组件

- **权限控制：**
  - 只有创建者可以删除显式关联（`hasExplicitAssociation === true`）
  - 根据用户角色过滤客户类型（前端专员：采购商，后端专员：供应商，总监/管理员：全部）

- **错误处理：**
  - 使用统一的错误消息常量
  - 显示用户友好的错误消息
  - 记录错误日志（`console.error`）

- **性能优化：**
  - 使用 React Query 缓存关联列表（`staleTime: 5 * 60 * 1000`）
  - 使用 debounce 延迟搜索（500ms）
  - 分页加载关联列表（默认每页 10 条）

## Debug Log References

- 使用 `productsService.getProductAssociations` 获取关联列表
- 使用 `productsService.createProductCustomerAssociation` 创建关联
- 使用 `productsService.deleteProductCustomerAssociation` 删除关联
- 使用 `CustomerMultiSelect` 组件搜索客户（参考 `ProductCreateForm` 的实现）
- 关联管理弹窗路由：无（模态框，不涉及路由）
- 客户详情页路由：`/customers/:customerId/interactions`（客户互动历史页面，作为客户详情页）
- React Query 缓存键：统一使用 `['product-associations', productId, page, limit]` 作为管理弹窗的缓存键

