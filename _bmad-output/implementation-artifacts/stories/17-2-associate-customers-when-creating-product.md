# Story 17.2: 产品创建时关联客户（前端）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **所有用户**,
I want **在创建产品时快速关联客户**,
So that **我可以一步完成产品创建和客户关联，提升工作效率**.

## Acceptance Criteria

1. **Given** 用户已登录系统并进入产品创建页面
   **When** 用户填写产品创建表单
   **Then** 表单包含"关联客户"部分（可折叠，默认折叠）
   **And** 用户可以选择展开"关联客户"部分
   **And** "关联客户"部分显示搜索下拉组件（支持多选）
   **And** 搜索下拉组件根据用户角色过滤客户类型：
     - 前端专员：只显示采购商
     - 后端专员：只显示供应商
     - 总监/管理员：显示所有客户

2. **Given** 用户在"关联客户"部分搜索客户
   **When** 用户输入客户名称或代码
   **Then** 系统显示匹配的客户列表（支持模糊搜索）
   **And** 用户可以选择多个客户
   **And** 系统显示已选择的客户数量："已选择 3 个客户"
   **And** 用户可以取消选择已选客户

3. **Given** 用户填写完产品信息和关联客户
   **When** 用户提交产品创建表单
   **Then** 系统首先创建产品
   **And** 如果用户选择了关联客户，系统为每个客户建立关联关系
   **And** 关联类型根据客户类型自动设置：
     - 采购商：`POTENTIAL_BUYER`
     - 供应商：`POTENTIAL_SUPPLIER`
   **And** 系统显示成功消息："产品创建成功，已关联 X 个客户"
   **And** 如果关联失败，系统显示错误消息，但产品创建成功

4. **Given** 用户未选择关联客户
   **When** 用户提交产品创建表单
   **Then** 系统正常创建产品
   **And** 不建立任何关联关系
   **And** 系统显示成功消息："产品创建成功"

5. **Given** 用户创建产品时关联客户失败
   **When** 产品创建成功但关联失败
   **Then** 系统显示警告消息："产品已创建，但部分客户关联失败"
   **And** 系统提供"在详情页管理关联"的链接
   **And** 用户可以稍后在产品详情页手动建立关联

## Tasks / Subtasks

- [x] Task 1: 创建多选客户搜索组件 (AC: #1, #2)
  - [x] 创建 `customers/components/CustomerMultiSelect.tsx` 组件
    - [x] **UI 结构参考：**
      - [x] 参考 `HsCodeSelect` 组件的实现模式（搜索输入框 + 下拉结果列表 + 键盘导航）
      - [x] 参考 `InteractionCreateForm` 中已选客户的显示方式（tag 形式，带删除按钮，参考第 459-473 行）
      - [x] 搜索输入框：使用 `Input` 组件，支持 debounce（500ms，参考 `CustomerSearch` 的实现）
      - [x] 下拉结果列表：使用绝对定位的 `div`，显示匹配的客户列表（参考 `HsCodeSelect` 第 163-200 行）
      - [x] 已选客户标签：显示在搜索输入框下方，每个标签显示客户名称和删除按钮
    - [x] **搜索功能实现：**
      - [x] 使用 `customersService.getCustomers` 进行搜索（参考 `CustomerSearch` 的实现）
      - [x] 实现 debounce（500ms，参考 `CustomerSearch` 第 72-89 行）
      - [x] 根据用户角色过滤客户类型（参考 `CustomerSearch` 第 43-51 行的 `fixedCustomerType` 逻辑）
      - [x] 支持模糊搜索（客户名称或客户代码）
    - [x] **多选交互实现：**
      - [x] 点击搜索结果项时，添加到已选列表（如果未选择）
      - [x] 点击已选客户标签的删除按钮时，从已选列表移除
      - [x] 显示已选择客户数量："已选择 X 个客户"（显示在搜索输入框下方）
    - [x] **键盘导航实现：**
      - [x] Arrow keys：在下拉列表中导航（参考 `HsCodeSelect` 第 70-101 行）
      - [x] Enter：选择当前高亮的客户
      - [x] Escape：关闭下拉列表
    - [x] **无障碍访问：**
      - [x] 添加 ARIA labels（`aria-label`, `aria-expanded`, `aria-haspopup`）
      - [x] 支持键盘导航（`tabIndex`, `role="option"`）
  - [x] 组件 Props：
    - [x] `selectedCustomers: Customer[]` - 已选择的客户列表
    - [x] `onChange: (customers: Customer[]) => void` - 选择变化回调
    - [x] `userRole?: string` - 用户角色（用于过滤）
    - [x] `placeholder?: string` - 占位符文本（默认："搜索客户名称或代码..."）
    - [x] `disabled?: boolean` - 是否禁用
    - [x] `error?: boolean` - 是否显示错误状态
    - [x] `errorMessage?: string` - 错误消息

- [x] Task 2: 扩展产品创建表单 (AC: #1, #2, #3, #4, #5)
  - [x] 修改 `products/components/ProductCreateForm.tsx`
    - [x] **添加"关联客户"可折叠部分：**
      - [x] **重要：不使用第三方 Collapsible/Accordion 组件**（代码库中没有，也不应添加）
      - [x] 使用 `useState` 管理展开/折叠状态：`const [isAssociationExpanded, setIsAssociationExpanded] = useState(false)`
      - [x] 使用 Tailwind CSS 实现折叠动画：
        - [x] 使用条件渲染：`{isAssociationExpanded && <div>...</div>}`
        - [x] 使用 Tailwind 的 `transition` 和 `transform` 类实现平滑动画（参考 `MainLayout` 中 `sidebarCollapsed` 的实现模式）
        - [x] 添加展开/折叠按钮（使用 `Button` 组件，显示箭头图标）
      - [x] 默认折叠状态（`isAssociationExpanded = false`）
    - [x] 集成 `CustomerMultiSelect` 组件
    - [x] 添加状态管理：`selectedCustomers: Customer[]`
    - [x] 在表单提交时处理关联逻辑
  - [x] 修改 `handleSubmit` 方法：
    - [x] 首先调用 `productsService.createProduct` 创建产品
    - [x] 如果创建成功且有 `selectedCustomers`，循环调用关联 API
    - [x] 使用 `Promise.allSettled` 处理批量关联（允许部分失败）
    - [x] 根据关联结果显示不同的成功/警告消息
    - [x] 如果产品创建成功但关联失败，提供"在详情页管理关联"的链接（使用 toast.info 显示可点击的消息）

- [x] Task 3: 创建关联 API 服务方法 (AC: #3)
  - [x] 在 `products/products.service.ts` 中添加关联方法：
    - [x] `createProductCustomerAssociation(productId: string, customerId: string, associationType: AssociationType): Promise<void>`
    - [x] 调用 `POST /api/products/:productId/associations` 端点
    - [x] 请求体：`{ customerId: string, associationType: AssociationType }`
    - [x] 使用 JWT token 进行认证（使用现有的 `getAuthToken` 方法）
    - [x] 实现错误处理（400, 403, 404, 500）
  - [x] **关联类型定义（优先方案）：**
    - [x] **检查 Story 17.1 的实现：** 后端已导出 `AssociationType` 枚举（`fenghua-backend/src/products/constants/association-types.ts`）
    - [x] **如果后端未导出类型：** 在前端创建类型定义文件：
      - [x] 创建 `fenghua-frontend/src/products/types/association-types.ts`
      - [x] 定义：`export type AssociationType = 'POTENTIAL_SUPPLIER' | 'POTENTIAL_BUYER'`
    - [x] **导入方式：** 在 `products.service.ts` 中导入：`import { AssociationType } from './types/association-types'`

- [x] Task 4: 实现关联逻辑和错误处理 (AC: #3, #4, #5)
  - [x] 在 `ProductCreateForm` 中实现关联创建逻辑：
    - [x] **修改 `handleSubmit` 方法：**
      - [x] 首先调用 `productsService.createProduct` 创建产品
      - [x] 从返回值中获取 `product.id`：`const createdProduct = await productsService.createProduct(submitData)`
      - [x] 如果创建成功且有 `selectedCustomers`，批量创建关联
    - [x] **关联类型确定：**
      - [x] 根据客户类型确定关联类型：
        - [x] `customer.customerType === 'BUYER'` → `'POTENTIAL_BUYER'`
        - [x] `customer.customerType === 'SUPPLIER'` → `'POTENTIAL_SUPPLIER'`
    - [x] **批量关联实现：**
      - [x] 使用 `Promise.allSettled` 批量创建关联（允许部分失败）
      - [x] **注意：** 关联创建是轻量级操作，不需要限制并发数量
      - [x] 为每个客户调用：`productsService.createProductCustomerAssociation(createdProduct.id, customer.id, associationType)`
      - [x] 统计成功和失败的关联数量：
        - [x] `const successCount = results.filter(r => r.status === 'fulfilled').length`
        - [x] `const failureCount = results.filter(r => r.status === 'rejected').length`
    - [x] **消息显示和导航：**
      - [x] 使用 `toast.success` 或 `toast.warning` 显示消息（参考 `InteractionCreateForm` 的使用方式）
      - [x] 显示相应的成功/警告消息：
        - [x] 全部成功：`PRODUCT_CREATE_WITH_ASSOCIATIONS_SUCCESS(selectedCustomers.length)`
        - [x] 部分失败：`PRODUCT_CREATE_ASSOCIATIONS_PARTIAL_FAILURE(successCount, failureCount)`
        - [x] 全部失败：`PRODUCT_CREATE_ASSOCIATIONS_ALL_FAILURE`
      - [x] **导航到产品详情页：**
        - [x] 导入 `useNavigate`：`import { useNavigate } from 'react-router-dom'`
        - [x] 产品详情页路由：`/products/:productId`（参考 `App.tsx` 中的路由配置）
        - [x] 如果关联失败（部分或全部），在警告消息中提供链接（使用 toast.info 显示可点击的消息，点击后导航到详情页）
        - [x] 如果全部成功，保持在当前页面（根据 UX 需求）

- [x] Task 5: 添加错误消息常量 (AC: #3, #5)
  - [x] 在 `common/constants/error-messages.ts` 中添加关联相关的错误消息：
    - [x] **使用函数形式接受参数（参考现有错误消息的模式）：**
      - [x] `export const PRODUCT_CREATE_SUCCESS = '产品创建成功'`（字符串常量）
      - [x] `export const PRODUCT_CREATE_WITH_ASSOCIATIONS_SUCCESS = (count: number) => \`产品创建成功，已关联 ${count} 个客户\``（函数）
      - [x] `export const PRODUCT_CREATE_ASSOCIATIONS_PARTIAL_FAILURE = (successCount: number, failureCount: number) => \`产品已创建，但部分客户关联失败（成功：${successCount}，失败：${failureCount}）\``（函数）
      - [x] `export const PRODUCT_CREATE_ASSOCIATIONS_ALL_FAILURE = '产品已创建，但所有客户关联失败'`（字符串常量）
      - [x] `export const ASSOCIATION_CREATE_FAILED = (error: string) => \`创建关联失败：${error}\``（函数）
      - [x] `export const MANAGE_ASSOCIATIONS_IN_DETAIL = '在详情页管理关联'`（字符串常量）
    - [x] **使用方式：**
      - [x] 字符串常量直接使用：`toast.success(PRODUCT_CREATE_SUCCESS)`
      - [x] 函数形式调用：`toast.success(PRODUCT_CREATE_WITH_ASSOCIATIONS_SUCCESS(3))`

- [x] Task 6: 更新 UI 和样式 (AC: #1, #2)
  - [x] 确保"关联客户"部分使用统一的折叠组件样式
    - [x] 使用 Tailwind CSS 的 `border`, `rounded-monday-md`, `p-monday-4` 等类（参考 `Card` 组件的样式）
    - [x] 折叠按钮使用 `Button` 组件，显示箭头图标（展开时向下，折叠时向右）
  - [x] 确保 `CustomerMultiSelect` 组件样式与现有设计系统一致
    - [x] 使用 `Input` 组件（参考 `CustomerSearch` 的实现）
    - [x] 下拉列表使用 `bg-monday-surface`, `border-gray-200`, `shadow-monday-lg` 等类（参考 `HsCodeSelect` 的样式）
    - [x] 已选客户标签使用 `bg-monday-bg-secondary`, `rounded-monday-md`, `p-monday-3` 等类（参考 `InteractionCreateForm` 第 459-473 行）
  - [x] **实现响应式设计（移动端适配）：**
    - [x] 多选组件在移动端（`max-width: 767px`）：
      - [x] 搜索输入框使用全宽（`w-full`）
      - [x] 下拉列表使用全宽，最大高度限制（`max-h-60`）
      - [x] 已选客户标签支持横向滚动（`overflow-x-auto`, `flex-nowrap`）
    - [x] 折叠部分在移动端：
      - [x] 保持默认折叠，但确保折叠按钮足够大（最小 44x44px，符合触摸目标要求）
  - [x] 添加加载状态指示器（关联创建中）
    - [x] 在批量关联创建时，显示加载状态（使用 `isSubmitting` 状态）
    - [x] 在 `CustomerMultiSelect` 搜索时，显示加载指示器（参考 `CustomerSearch` 的 `loading` prop）
  - [x] 添加空状态提示（无客户可选时）
    - [x] 当搜索结果为空时，显示："未找到匹配的客户"（参考 `HsCodeSelect` 第 164-167 行）
    - [x] 当没有可选客户时（权限限制），显示："您没有可关联的客户"

- [ ] Task 7: 添加测试用例 (AC: #1, #2, #3, #4, #5)
  - [ ] 添加 `CustomerMultiSelect.test.tsx` 测试：
    - [ ] **多选功能测试：**
      - [ ] 测试选择单个客户
      - [ ] 测试选择多个客户
      - [ ] 测试取消选择已选客户
      - [ ] 测试已选客户数量显示
    - [ ] **搜索功能测试：**
      - [ ] 测试输入搜索关键词触发搜索
      - [ ] 测试 debounce 延迟（500ms）
      - [ ] 测试模糊搜索（客户名称和代码）
      - [ ] 测试空搜索结果显示
    - [ ] **角色过滤测试：**
      - [ ] 测试前端专员只显示采购商
      - [ ] 测试后端专员只显示供应商
      - [ ] 测试总监/管理员显示所有客户
    - [ ] **键盘导航测试：**
      - [ ] 测试 Arrow keys 导航
      - [ ] 测试 Enter 选择
      - [ ] 测试 Escape 关闭下拉列表
  - [ ] 添加 `ProductCreateForm.test.tsx` 测试（或更新现有测试）：
    - [ ] **关联客户部分测试：**
      - [ ] 测试折叠部分的显示/隐藏
      - [ ] 测试默认折叠状态
      - [ ] 测试展开/折叠按钮功能
    - [ ] **产品创建和关联测试：**
      - [ ] 测试产品创建成功后的关联创建（全部成功）
      - [ ] 测试产品创建成功但关联部分失败
      - [ ] 测试产品创建成功但关联全部失败
      - [ ] 测试未选择客户时的正常创建（不创建关联）
    - [ ] **错误处理测试：**
      - [ ] 测试产品创建失败时的错误处理
      - [ ] 测试关联创建失败时的警告消息
      - [ ] 测试导航到产品详情页的链接功能
    - [ ] **边界情况测试：**
      - [ ] 测试网络错误时的处理
      - [ ] 测试权限错误时的处理（403）
      - [ ] 测试产品不存在时的处理（404）

## Dev Notes

### Architecture Compliance

**技术栈：**
- React + TypeScript
- React Hook Form（表单管理）
- React Query（API 调用和状态管理）
- Tailwind CSS（样式）
- React Toastify（消息提示）

**项目结构：**
- 组件文件：`fenghua-frontend/src/customers/components/CustomerMultiSelect.tsx`
- 表单文件：`fenghua-frontend/src/products/components/ProductCreateForm.tsx`（修改）
- 服务文件：`fenghua-frontend/src/products/products.service.ts`（扩展）
- 常量文件：`fenghua-frontend/src/common/constants/error-messages.ts`（扩展）

**UI/UX 设计：**
- 参考 Sally 的 UI 设计：创建时快速关联（可选）
- 使用 `useState` + Tailwind CSS 实现"关联客户"可折叠部分（不使用第三方组件）
- 默认折叠，减少表单复杂度
- 多选组件使用 tag 模式显示已选客户（参考 `InteractionCreateForm` 的实现）
- 支持搜索和键盘导航（参考 `HsCodeSelect` 的实现）

**API 集成：**
- 使用 Story 17.1 创建的关联 API：`POST /api/products/:id/associations`
- 请求体：`{ customerId: string, associationType: 'POTENTIAL_SUPPLIER' | 'POTENTIAL_BUYER' }`
- 响应：`{ id: string, productId: string, customerId: string, associationType: string }`

**错误处理：**
- 产品创建和关联建立分开处理
- 使用 `Promise.allSettled` 允许部分关联失败
- 提供清晰的错误消息和恢复建议
- 使用统一的错误消息常量

### Previous Story Intelligence

**参考 Story 4.1 的实现：**
- `InteractionCreateForm` 中的客户选择实现
- `CustomerSearch` 组件的搜索和过滤逻辑
- 角色过滤的实现方式（`isFrontendSpecialist`, `isBackendSpecialist`）

**参考 Story 17.1 的实现：**
- 关联 API 端点和请求格式
- 关联类型的定义和使用
- 错误处理和权限验证

**参考 Story 2.1 的实现：**
- `ProductCreateForm` 的现有实现
- 表单验证和错误处理模式
- 成功消息的显示方式

### File Structure Requirements

**前端文件结构：**
```
fenghua-frontend/
├── src/
│   ├── customers/
│   │   └── components/
│   │       └── CustomerMultiSelect.tsx (新建)
│   ├── products/
│   │   ├── components/
│   │   │   └── ProductCreateForm.tsx (修改)
│   │   └── products.service.ts (扩展)
│   └── common/
│       └── constants/
│           └── error-messages.ts (扩展)
```

**命名约定：**
- 组件：`CustomerMultiSelect` (PascalCase)
- 方法：`createProductCustomerAssociation` (camelCase)
- 常量：`PRODUCT_CREATE_SUCCESS` (UPPER_SNAKE_CASE)

### Testing Requirements

**测试文件位置：**
- 组件测试：`fenghua-frontend/src/customers/components/CustomerMultiSelect.test.tsx`
- 表单测试：`fenghua-frontend/src/products/components/ProductCreateForm.test.tsx`（更新）

**测试覆盖：**
- 单元测试：测试组件功能（多选、搜索、过滤）
- 集成测试：测试表单提交和 API 调用
- 错误处理测试：测试关联失败场景
- 角色过滤测试：测试不同角色的客户过滤

**Mock 依赖：**
- Mock `productsService.createProduct`
- Mock `productsService.createProductCustomerAssociation`
- Mock `customersService.getCustomers`
- Mock React Query hooks

### References

- Epic 17 定义：`_bmad-output/epics.md#epic-17`
- Story 17.2 详细说明：`_bmad-output/epics.md#story-17-2`
- Story 17.1 实现：`_bmad-output/implementation-artifacts/stories/17-1-product-customer-association-data-model-and-api.md`
- 架构设计：`_bmad-output/architecture.md`
- UX 设计：`_bmad-output/ux-design-specification.md`
- 产品创建表单参考：`fenghua-frontend/src/products/components/ProductCreateForm.tsx`
- 客户搜索组件参考：`fenghua-frontend/src/customers/components/CustomerSearch.tsx`
- 互动创建表单参考：`fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx`
- 产品服务参考：`fenghua-frontend/src/products/products.service.ts`
- 客户服务参考：`fenghua-frontend/src/customers/customers.service.ts`

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5

### Debug Log References
- 修复了 `NodeJS.Timeout` 类型错误，使用 `ReturnType<typeof setTimeout>` 替代
- 修复了 ProductManagementPage 中的重复创建问题，在 ProductCreateForm 中直接创建产品
- 使用 toast.info 显示可点击的导航消息（点击后导航到产品详情页）

### Completion Notes List
1. **CustomerMultiSelect 组件：** 成功创建多选客户搜索组件，支持搜索、多选、键盘导航、角色过滤等功能
2. **ProductCreateForm 扩展：** 添加了可折叠的"关联客户"部分，集成了 CustomerMultiSelect 组件
3. **关联 API 服务：** 在 products.service.ts 中添加了 `createProductCustomerAssociation` 方法
4. **关联逻辑：** 实现了产品创建后的批量关联创建，使用 `Promise.allSettled` 处理部分失败场景
5. **错误消息：** 添加了所有相关的错误消息常量，使用函数形式支持参数化消息
6. **UI/UX：** 实现了响应式设计，添加了加载状态和空状态提示

### Code Review Fixes Applied (2025-01-03)
1. **Issue #1 (HIGH):** 修复了 `NodeJS.Timeout` 类型不一致问题，改为 `ReturnType<typeof setTimeout>`
2. **Issue #2 (MEDIUM):** 改进了 toast 导航 UX，使用 `Button` 组件替代延迟的 `toast.info`，提供更清晰的导航选项
3. **Issue #3 (MEDIUM):** 优化了 `searchCustomers` 回调依赖，使用 `useRef` 存储 `selectedCustomers` 避免不必要的重新渲染
4. **Issue #4 (MEDIUM):** 添加了失败关联的错误详情记录，现在会记录哪些客户关联失败及失败原因
5. **Issue #5 (MEDIUM):** 验证并修复了 API 端点路径，从 `/api/products/:id/associations` 改为 `/products/:id/associations` 以保持一致性

### File List
**新建文件：**
- `fenghua-frontend/src/products/types/association-types.ts` - 关联类型定义
- `fenghua-frontend/src/customers/components/CustomerMultiSelect.tsx` - 多选客户搜索组件

**修改文件：**
- `fenghua-frontend/src/products/components/ProductCreateForm.tsx` - 添加关联客户功能
- `fenghua-frontend/src/products/products.service.ts` - 添加关联 API 方法
- `fenghua-frontend/src/products/ProductManagementPage.tsx` - 修复重复创建问题
- `fenghua-frontend/src/common/constants/error-messages.ts` - 添加错误消息常量

